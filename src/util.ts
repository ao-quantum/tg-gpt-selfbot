export const input = {
    text: async (prompt: string): Promise<string> => {
        const readline = require("readline").createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        return new Promise((resolve) => {
            readline.question(prompt, (text: string) => {
                readline.close();
                resolve(text);
            });
        });
    },
};
