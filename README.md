# <img src="./logo.svg" width="80" /> Sherlock

> GitHub Actions toolkit to monitor a repository and run testcases

[![](https://img.shields.io/npm/v/@arcanis/sherlock.svg)]() [![](https://img.shields.io/npm/l/@arcanis/sherlock.svg)]() [![](https://img.shields.io/badge/status-experimental-red)]()

## What is it?

Sherlock will:

- Add `reproducible` / `unreproducible` / `broken-repro` labels on your issues
- Tell you why the assertions are failing
- Allow you to replay the reproduction cases locally with a single command

In the future, Sherlock will (non exhaustive list):

- Bisect to find out which commit introduced a bug
- Close the obsolete issues after each release

## Installation

```
yarn add -D @arcanis/sherlock
```

Then create a new [GitHub Workflow](https://help.github.com/en/articles/configuring-workflows) with the following content:

```yml
on: [issues]

name: Sherlock
jobs:
  issue:
    name: Running Sherlock
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@master

      - name: Use Node.js 10.x
        uses: actions/setup-node@master
        with:
          version: 10.x

      - name: Use Yarn 1.17.2
        run: |
          npm install -g yarn@1.17.2
          yarn

      - name: Sherlock Payload
        run: |
          yarn sherlock payload

      - name: Sherlock Execution
        uses: docker://node:lts-jessie
        with:
          entrypoint: bash
          args: scripts/actions/sherlock-docker.sh

      - name: Sherlock Reporting
        run: |
          yarn sherlock report
        env:
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
```

## Documentation

### What's a test from Sherlock's perspective?

Sherlock will pick up any code block that includes a particular fence:

~~~markdown
This is my reproduction case:

```js repro
const foo = ...;
```
~~~

Note that the `repro` keyword is important here: it's what allows Sherlock to know that the code sample is a test and should be run against master.

### How to write tests?

Sherlock uses [`expect`](https://jestjs.io/docs/en/expect.html), the validator provided by the [Jest](http://github.com/facebook/jest) project. The `expect` function is automatically exposed as a global variable, so you just need to write your assertions as if you were in an actual test:

```js
expect([`foo`, `bar`]).toEqual([`bar`, `foo`]);
```

Note that any exception thrown that is not an assertion will cause Sherlock to report the test as broken - if the exception is expected, then you should mark it as such:

```js
expect(() => {
  somethingThatWillThrow();
}).toThrow();
```

### How to use promises?

Sherlock automatically supports top-level `await` in the testcase, so just use `await fn()` as you usually would and you're good to go! And since `expect` has [builtin support for promises](https://jestjs.io/docs/en/expect.html#resolves), you can use them in your assertions too:

```js
await expect(doSomethingAsync()).resolves.toEqual(42);
```

### How to setup the environment under which the tests will run?

There are three options:

  - Create a `sherlock.setup.js` at the root of your repository
  - Define a `sherlock.requireList` array in your package.json
  - Use the `--require` flag when calling `yarn sherlock exec`

The specified scripts will then be loaded into the environment before the testcase runs. It's a good way to expose global helper functions that will abstract the boilerplate required by the reproduction cases:

```js
const {promises: fs} = require(`fs`);

global.preparePackageJson = async function (data) {
  await fs.writeFile(`package.json`, JSON.stringify(data, null, 2));
};
```

### How to run a testcase on my own machine?

Just go into your repository, ensure that your package.json contains the right fields:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/octocat/example.git"
  }
}
```

Then run the following command:

```
yarn sherlock 1
```

This will download and run (on your machine, so be careful!) the testcase for the issue 1. It also works with full length GitHub issues, so you can just copy-paste it:

```
yarn sherlock https://github.com/octocat/example/issues/1
```

## How does it work?

Each time a new issue is created (or edited, or unlabeled), we run a three-part pipeline:

- First we extract the issue metadata and store it in a known location
- Then we spawn a container that executes the embed script and stores its result somewhere
- Then we report back the result to GitHub

The reason why we do all this in three steps (rather than a single one) is that we need to execute the script within its own container in order to prevent it from accessing the GitHub token that we use to report back the result.

## How to make it better?

Some things that GitHub could do to make Sherlock better integrated:

- support a copy button on code blocks (this way we can just copy the repro to try it out locally)
- support CI-like status for issues (this way we could avoid polluting the comment thread)
- support for fine-tuned triggers (this way we could avoid spawning the workflow for issue events we don't care)

## License (MIT)

> **Copyright © 2019 Maël Nison**
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
