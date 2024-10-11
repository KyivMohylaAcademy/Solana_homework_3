module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: [
        '**/?(*.)+(spec|test).[jt]s?(x)', // Adjust this if necessary
    ],
    transform: {
        '^.+\\.ts$': 'ts-jest', // Add this line to transform TypeScript files
    },
};
