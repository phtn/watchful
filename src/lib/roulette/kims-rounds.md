=== Five-Round Collapse Reset ===
Start: any quadrant
┌───┬──────┬────────┬───────┬──────────┬──────────────────┬──────┬──────┬───────┬──────┬──────────────────────┬────────────┬──────────┐
│   │ spin │ landed │ round │ quadrant │ bet              │ unit │ zero │ total │ hit  │ outcome              │ candidates │ next     │
├───┼──────┼────────┼───────┼──────────┼──────────────────┼──────┼──────┼───────┼──────┼──────────────────────┼────────────┼──────────┤
│ 0 │ 0    │ -      │ 1     │ any q    │ [ 8, 9, 12, 11]  │ 1    │ 0    │ 4     │ miss │ continue             │ q4         │   ---    │
│ 1 │ 1    │ 14     │ 2     │ q5       │ [13, 14,17,16]   │ 2    │ 0    │ 8     │ miss │ continue             │ q5, q6     │          │
│ 2 │ 2    │ 25     │ 3     │ q9       │ [25,26,29,28]    │ 4    │ 0    │ 16    │ miss │ continue             │ q9         │          │
│ 3 │ 4    │ 32     │ 4     │ q11      │ [31,32,35,34]    │ 8    │ 8    │ 40    │ miss │ continue             │ q11, q12   │          │
│ 4 │ 5    │ 29     │ 5     │ q10      │ [26,27,30,29]    │ 16   │ 16   │ 80    │ miss │ reset_after_max_loss │ q10        │          │
└───┴──────┴────────┴───────┴──────────┴──────────────────┴──────┴──────┴───────┴──────┴──────────────────────┴────────────┴──────────┘

```csv

bet_numbers,placement_count,coverage_percent,unit_stake,zero_stake,total_stake,hit,hit_type,session_outcome,candidate_quadrants,selected_quadrant,next_round,next_quadrant,next_quadrants
Drift Then Quadrant Hit,q1,1,1,32,1,q1,1 2 5 4,4,10.81,1,0,4,false,miss,continue,q11 q12,q11,2,q11,q1 q11
Drift Then Quadrant Hit,q1,1,2,15,2,q1 q11,1 2 5 4 31 32 35 34,8,21.62,1,0,8,false,miss,continue,q6,q6,3,q6,q1 q11 q6
Drift Then Quadrant Hit,q1,1,3,19,3,q1 q11 q6,1 2 5 4 31 32 35 34 14 15 18 17,12,32.43,2,0,24,false,miss,continue,q7,q7,4,q7,q1 q11 q6 q7
Drift Then Quadrant Hit,q1,1,4,4,4,q1 q11 q6 q7,1 2 5 4 31 32 35 34 14 15 18 17 19 20 23 22,17,45.95,2,2,34,true,quadrant,reset_after_win,q1,q1,1,q1,q1
Drift Then Quadrant Hit,q1,1,5,21,1,q1,1 2 5 4,4,10.81,1,0,4,false,miss,continue,q8,q8,2,q8,q1 q8
Drift Then Quadrant Hit,q1,1,6,2,2,q1 q8,1 2 5 4 20 21 24 23,8,21.62,1,0,8,true,quadrant,reset_after_win,q1 q2,q2,1,q2,q2
Zero Hedge Rescue,q9,1,1,1,1,q9,25 26 29 28,4,10.81,1,0,4,false,miss,continue,q1,q1,2,q1,q9 q1
Zero Hedge Rescue,q9,1,2,13,2,q9 q1,25 26 29 28 1 2 5 4,8,21.62,1,0,8,false,miss,continue,q5,q5,3,q5,q9 q1 q5
Zero Hedge Rescue,q9,1,3,31,3,q9 q1 q5,25 26 29 28 1 2 5 4 13 14 17 16,12,32.43,2,0,24,false,miss,continue,q11,q11,4,q11,q9 q1 q5 q11
Zero Hedge Rescue,q9,1,4,0,4,q9 q1 q5 q11,25 26 29 28 1 2 5 4 13 14 17 16 31 32 35 34,17,45.95,2,2,34,true,zero,reset_after_win,,q11,1,q11,q11
Zero Hedge Rescue,q9,1,5,29,1,q11,31 32 35 34,4,10.81,1,0,4,false,miss,continue,q9 q10,q10,2,q10,q11 q10
Five-Round Collapse Reset,q4,1,1,14,1,q4,8 9 12 11,4,10.81,1,0,4,false,miss,continue,q5 q6,q5,2,q5,q4 q5
Five-Round Collapse Reset,q4,1,2,25,2,q4 q5,8 9 12 11 13 14 17 16,8,21.62,1,0,8,false,miss,continue,q9,q9,3,q9,q4 q5 q9
Five-Round Collapse Reset,q4,1,3,32,3,q4 q5 q9,8 9 12 11 13 14 17 16 25 26 29 28,12,32.43,2,0,24,false,miss,continue,q11 q12,q11,4,q11,q4 q5 q9 q11
Five-Round Collapse Reset,q4,1,4,7,4,q4 q5 q9 q11,8 9 12 11 13 14 17 16 25 26 29 28 31 32 35 34,17,45.95,2,2,34,false,miss,continue,q3,q3,5,q3,q4 q5 q9 q11 q3
Five-Round Collapse Reset,q4,1,5,18,5,q4 q5 q9 q11 q3,8 9 12 11 13 14 17 16 25 26 29 28 31 32 35 34 7 8 11 10,21,56.76,2,2,42,false,miss,reset_after_max_loss,q6,q6,1,q6,q6
```
