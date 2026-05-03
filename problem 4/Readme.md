# Problem 4

## Project Overview
This project implements three different ways to compute the sum of integers from 1 to `n` in TypeScript.

- `sum_to_n_a(n)`: Uses the Gauss formula `n * (n + 1) / 2`.
- `sum_to_n_b(n)`: Uses a loop to accumulate the sum from `1` to `n`.
- `sum_to_n_c(n)`: Uses recursion with `S(n) = n + S(n - 1)` and `S(1) = 1`.

The main entry point is `main.ts`, which reads user input from the terminal using `readline`.

## Prerequisites
- Node.js
- npm

## Install
1. Open a terminal in the project folder.
2. Run:

```bash
npm install
```

## Build and Run
To compile and run the project:

```bash
npm run build
npm run start
```

Then enter a number when prompted. The program will print the sum from `1` to that number.

## Notes
- This project uses ESM via `"type": "module"` in `package.json`.
- Compiled output is stored in `dist/`.
- If you change TypeScript source, rerun `npm run build` before `npm run start`.
