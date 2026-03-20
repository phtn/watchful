(function () {
  "use strict";

  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  const gameKeywords = [
    "bet",
    "spin",
    "game",
    "play",
    "result",
    "outcome",
    "win",
    "lose",
    "jackpot",
    "bonus",
    "round",
    "turn",
    "deal",
    "draw",
    "roll",
    "limbo",
    "dice",
    "keno",
    "stake",
  ];

  function hasGameKeyword(value: string): boolean {
    const lowerValue = value.toLowerCase();
    return gameKeywords.some((keyword) => lowerValue.includes(keyword));
  }

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  function looksLikeBet88Result(value: unknown): boolean {
    return (
      isRecord(value) &&
      typeof value.roundId === "number" &&
      typeof value.win === "boolean"
    );
  }

  function looksLikeStakeBetPayload(value: unknown): boolean {
    return (
      isRecord(value) &&
      typeof value.id === "string" &&
      typeof value.game === "string" &&
      isRecord(value.user) &&
      isRecord(value.state)
    );
  }

  function responseLooksGameRelated(value: unknown, depth = 0): boolean {
    if (depth > 3 || value == null) {
      return false;
    }

    if (typeof value === "string") {
      return hasGameKeyword(value);
    }

    if (looksLikeBet88Result(value) || looksLikeStakeBetPayload(value)) {
      return true;
    }

    if (Array.isArray(value)) {
      return value.some((entry) => responseLooksGameRelated(entry, depth + 1));
    }

    if (isRecord(value)) {
      return Object.entries(value).some(([key, entry]) => {
        if (hasGameKeyword(key)) {
          return true;
        }

        return responseLooksGameRelated(entry, depth + 1);
      });
    }

    return false;
  }

  function isGameRelatedURL(url: string): boolean {
    return hasGameKeyword(url);
  }

  function parseJSON(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  function captureRequestBody(body?: BodyInit | Document | null): {
    parsed: unknown;
    text: string | null;
  } {
    if (!body) {
      return { parsed: null, text: null };
    }

    if (typeof body === "string") {
      return {
        parsed: parseJSON(body),
        text: body,
      };
    }

    if (body instanceof URLSearchParams) {
      const text = body.toString();
      return {
        parsed: text,
        text,
      };
    }

    if (body instanceof FormData) {
      const parsed = Object.fromEntries(
        Array.from(body.entries()).map(([key, value]) => [
          key,
          typeof value === "string" ? value : "[binary]",
        ]),
      );

      return {
        parsed,
        text: JSON.stringify(parsed),
      };
    }

    return {
      parsed: body,
      text: null,
    };
  }

  function requestLooksGameRelated(
    url: string,
    requestBody: unknown,
    requestBodyText: string | null,
  ): boolean {
    if (isGameRelatedURL(url)) {
      return true;
    }

    if (requestBodyText && hasGameKeyword(requestBodyText)) {
      return true;
    }

    if (requestBody && responseLooksGameRelated(requestBody)) {
      return true;
    }

    return false;
  }

  function sendToContentScript(data: unknown): void {
    window.postMessage(
      {
        type: "CASINO_RESPONSE",
        data,
      },
      "*",
    );
  }

  function getFetchMethod(input: RequestInfo | URL, init?: RequestInit): string {
    if (init?.method) {
      return init.method;
    }

    if (typeof input === "object" && "method" in input && input.method) {
      return input.method;
    }

    return "GET";
  }

  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const { parsed: requestBody, text: requestBodyText } = captureRequestBody(
      init?.body,
    );
    const hintedGameRequest = requestLooksGameRelated(
      url,
      requestBody,
      requestBodyText,
    );

    return originalFetch.call(this, input, init).then(async (response: Response) => {
      try {
        const clonedResponse = response.clone();
        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          return response;
        }

        const responseData = await clonedResponse.json();
        if (!hintedGameRequest && !responseLooksGameRelated(responseData)) {
          return response;
        }

        sendToContentScript({
          url,
          method: getFetchMethod(input, init),
          status: response.status,
          data: responseData,
          requestBody,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("Error intercepting fetch response:", error);
      }

      return response;
    });
  };

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async?: boolean,
    user?: string | null,
    password?: string | null,
  ): void {
    (this as XMLHttpRequest & { _url?: string })._url = url.toString();
    (this as XMLHttpRequest & { _method?: string })._method = method;

    return originalXHROpen.call(this, method, url, async ?? true, user, password);
  };

  XMLHttpRequest.prototype.send = function (
    body?: Document | XMLHttpRequestBodyInit | null,
  ): void {
    const xhr = this as XMLHttpRequest & {
      _url?: string;
      _method?: string;
    };
    const url = xhr._url || "";
    const method = xhr._method || "GET";
    const { parsed: requestBody, text: requestBodyText } = captureRequestBody(
      body,
    );
    const hintedGameRequest = requestLooksGameRelated(
      url,
      requestBody,
      requestBodyText,
    );
    const originalOnReadyStateChange = xhr.onreadystatechange;

    xhr.onreadystatechange = function (this: XMLHttpRequest, ev: Event): unknown {
      if (this.readyState === 4) {
        try {
          const contentType = this.getResponseHeader("content-type") || "";

          if (contentType.includes("application/json") && this.responseText) {
            const responseData = JSON.parse(this.responseText);

            if (hintedGameRequest || responseLooksGameRelated(responseData)) {
              sendToContentScript({
                url,
                method,
                status: this.status,
                data: responseData,
                requestBody,
                timestamp: Date.now(),
              });
            }
          }
        } catch (error) {
          console.error("Error intercepting XHR response:", error);
        }
      }

      if (originalOnReadyStateChange) {
        return originalOnReadyStateChange.call(this, ev);
      }

      return undefined;
    };

    return originalXHRSend.call(this, body);
  };

  console.log("Casino game interceptor injected successfully");
})();
