## Commit Messages

A commit message should typically consist of a header and a body separated by a blank line. Try to keep the header within 50 characters and the length of each line of the body at 72 characters.
The message header is a single line that contains a concise description of the problem being solved. This would typically tend to look like the sample syntax below:

```
<type>:<description>
<BLANK LINE>
<body>
```

## Types

This is typically a noun that describes the kind of change that the commit makes. Valid types are:


- **feat(feature):** a change that introduces a new feature to the codebase that an end-user will impact from.

- **fix (bug fix):** patches a bug or any otherwise unintended behaviour in your codebase.

- **Ref (refactor):** updating an already existing method of doing things. Either to simplify the code logic or improve code readability without affecting a codebase's externally perceived behaviour. The formal definition of a refactor.
- **test (when messing with tests):** changes to tests, either adding tests or updating them
- **chore (general maintenance):** the chore tag can be used for changes that involve general maintenance (e.g. updating content text) or simply as an available type for anything that doesn't quite fit into the other classes on this list
  
## Description
This can be seen as the subject of a mail. It's a short description of the problem. There aren't many hard rules to follow here other than general suggestions:

- try to point out the problem being solved
- no full stop/dot (.) at the end
- it should be in the present tense
- no need to capitalise the first letter
  
## Body
We use squash merges when merging feature branches. This means that the primary commit for a PR must contain the explanation of the solution, and that's what we use the body for. See existing PRs for samples

The header and body both need to be separated by one black line.

```
<header>
<BLANK LINE>
<Body>
```
Message bodies can take any form, such as bullet points, links to relevant websites, your thoughts… There is no actual convention here, and it is yours to make your own.

[A Note About Git Commit Messages](https://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html)

### Example commit messages

- feat: info route is too slow
  - Added a cache to reduce query times by 80%. Note that this cache means the production system would need multiple Redis server instances.

- feat: there's no endpoint for deleting security questions
  - Added a repo method and a `DELETE` endpoint.

- chore: generated docker images are too big
  - Ubuntu is too heavy for our deployments, so I switched to
alpine Linux. This meant some of our build processes too had
to change to accommodate the change to musl

## checkout to the local version of staging
- git checkout staging
- git checkout -b type/feature # where types is one of fix/feat/ref(actor)/chore


Solve a problem and write a test for that solution

 feat: what problem you're trying to solve


Push code

 git push origin type/problem-topic


From Gitlab, create a new pull request to the staging branch and ask one of your colleagues to review and approve it.

To integrate first:

 git checkout staging
git pull # get the latest merged code


## Anti-patterns
- Force Push
telling changes made for a fix(Define the problem instead)

## Pull requests Guidelines
- It must solve only one problem
- The PR title should be the same description as the primary commit.
- The PR description should contain an optional description of the problem(much larger than the title) and the body of the primary commit as a description.
- Once again, your PR must solve one problem, or it'll automatically be closed. This is the most essential rule for PRs
