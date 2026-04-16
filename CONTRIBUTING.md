# Contributing to NehoID

Thank you for your interest in contributing to NehoID! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by the [Nehonix Code of Conduct](https://nehonix.com/code-of-conduct). Please report any unacceptable behavior to support@nehonix.com.

## How Can I Contribute?

### Reporting Bugs

Bugs are tracked as GitHub issues. Create an issue and provide the following information:

- Use a clear and descriptive title
- Describe the exact steps to reproduce the bug
- Provide specific examples to demonstrate the steps
- Describe the behavior you observed and what you expected to see
- Include screenshots if applicable
- Include details about your environment (OS, browser, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are also tracked as GitHub issues. When creating an enhancement suggestion, include:

- A clear and descriptive title
- A detailed description of the proposed functionality
- Any potential implementation approaches you have in mind
- Why this enhancement would be useful to most NehoID users

### Pull Requests

1. Fork the repository
2. Create a new branch for your feature or bugfix (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure your changes don't break existing functionality
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js (version 16.x)
- npm or yarn

### Installation

```bash
# Clone your fork of the repo
git clone https://github.com/YOUR-USERNAME/nehoid.git

# Navigate to the project directory
cd nehoid

# Install dependencies
npm install
```

### Development Workflow

1. Make your changes to the codebase.
2. Run tests to ensure your changes don't break existing functionality:

```bash
npm test
```

3. Build the project to verify your changes work with the build system:

```bash
npm run build
```

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### JavaScript/TypeScript Styleguide

- All TypeScript code is linted with ESLint
- Use 2 spaces for indentation
- Prefer const over let. Never use var
- Use descriptive variable names
- Add JSDoc comments for all public APIs

### Documentation Styleguide

- Use Markdown for documentation
- Reference methods and classes with backticks: `NehoID.generate()`
- Include code examples for all public methods

## Important Notes

### Real Implementation Requirements

As per our development philosophy, we do not accept any mock implementations or placeholder code. All contributions must include real, functional implementations that fulfill the promised behavior.

### TODOs and FIXMEs

When submitting code, please ensure all TODOs and FIXMEs are addressed. If you find existing TODOs or FIXMEs in the codebase, consider addressing them as part of your contribution.

## License

By contributing to NehoID, you agree that your contributions will be licensed under the project's MIT license.

## Questions?

Feel free to contact the Nehonix team at team@nehonix.com if you have any questions about contributing.

Thank you for helping improve NehoID!
