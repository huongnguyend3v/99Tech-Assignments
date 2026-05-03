
import readline from 'readline'

// Gauss Formula: S(n) = (n(n+1))/2
function sum_to_n_a(n: number): number {
	return (n*(n+1))/2
}

// Iterative: Looping from 1 to n and summing up the numbers
function sum_to_n_b(n: number): number {
    let result = 0;
	for(let i = 1; i <= n; i++) {
        result = i + result;
    }

    return result;
}

// Recursion: S(n) = n + S(n-1) with S(1) = 1
function sum_to_n_c(n: number): number {
    if(n === 1) {
        return 1;
    }
    return n + sum_to_n_c(n - 1);
}

function trigger_sum_to_n(): void {
    // Create readline interface for user input
    const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
    });
    console.log('Sum to n calculator');
    console.log('Input "n" number to calculate the sum from 1 to n');
    rl.on('line', (input: string) => {
        console.log(`You typed: ${input}`);
        console.log('sum_to_n_a (Gauss)', sum_to_n_a(Number(input)));
        console.log('sum_to_n_b (Iterative)', sum_to_n_b(Number(input)));
        console.log('sum_to_n_c (Recursion)', sum_to_n_c(Number(input)));
        rl.close();
        if (input === 'exit') {
            rl.close();
    }
    });
}

function main(): void{
    trigger_sum_to_n()
}

main();