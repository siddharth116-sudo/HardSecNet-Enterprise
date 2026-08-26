# Contributing to HardSecNet-Enterprise

Thank you for your interest in contributing. This project focuses on endpoint security engineering and accepts contributions that improve audit accuracy, platform coverage, documentation, or test coverage.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/<your-username>/HardSecNet-Enterprise`
3. Create a feature branch: `git checkout -b feat/your-feature-name`
4. Set up your environment: `pip install -r requirements-dev.txt`
5. Run the tests: `pytest tests/`

## Contribution Guidelines

- **Keep changes focused** — one logical change per pull request
- **Write tests** — new functionality should include unit or integration tests
- **Document changes** — update relevant `.md` files if behavior changes
- **Security-first** — do not introduce hardcoded credentials, insecure defaults, or bypasses
- **No fabrication** — do not add benchmark checks you cannot verify against official CIS documentation

## Code Style

- Python: follow PEP 8, use type hints where appropriate
- PowerShell: use `Verb-Noun` naming, include `[CmdletBinding()]` on advanced functions
- Commit messages: use [Conventional Commits](https://www.conventionalcommits.org/) format

## Pull Request Checklist

- [ ] Tests pass locally
- [ ] No hardcoded secrets or credentials
- [ ] Relevant documentation updated
- [ ] Commit messages follow Conventional Commits
