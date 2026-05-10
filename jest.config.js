/** @type {import('jest').Config} */
const config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                module: 'commonjs',
                moduleResolution: 'node',
                jsx: 'react-jsx',
                esModuleInterop: true,
                allowJs: true,
                skipLibCheck: true,
                strict: true,
                paths: {
                    '@/*': ['./src/*'],
                },
            },
        }],
    },
    testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
}

module.exports = config
