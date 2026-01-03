# Running Tests in mama-plus

This project uses Jest for testing. Jest is a delightful JavaScript Testing Framework with a focus on simplicity.

## Execute Tests
To run the tests within this project, use the following command:

```
npm test
```

Alternatively, you can run the Jest command directly:

```
npx jest
```

If you'd like to watch files and rerun tests upon changes, enable the watch mode:
```
npm test -- --watch
```

Or:
```
npx jest --watch
```

## Advanced Jest Notes

1. **Configuring Jest**:
   - The Jest configuration file can be found as `jest.config.js` in the root. Review and update it as needed to control Jest's behavior.

2. **Using Coverage Report**:
   - Generate a coverage report with the command:
     ```
     npx jest --coverage
     ```
   - The generated report can be found in the `coverage` directory.

3. **Snapshot Testing**:
   - If this project utilizes snapshots, you can update expired snapshots by running:
     ```
     npx jest --updateSnapshot
     ```

4. **Debugging**:
   - Debug tests using the `--runInBand` option:
     ```
     npx jest --runInBand
     ```
   - Alternatively, use Node's inspect feature:
     ```
     node --inspect-brk node_modules/.bin/jest
     ```

5. **Custom Test Setup**:
   - Look for `setupFiles` or `setupFilesAfterEnv` in `jest.config.js` for any global setup scripts or configurations.

For additional Jest documentation, consult the official website: [https://jestjs.io](https://jestjs.io)