# Satispress Alfred 4 Workflow

> Alfred 4 workflow for SatisPress. Search your WordPress plugins managed by your SatisPress package manager right in Alfred.

## Install

```bash
$ npm install --global alfred-satispress
```

*Requires [Node.js](https://nodejs.org) 14+ and the Alfred [Powerpack](https://www.alfredapp.com/powerpack/).*

## Commands

- In Alfred, type `satispress` and your query after with a `space` in between to search your packages. Press <kbd>Enter</kbd> to copy the selected package's name to the clipboard.

## Workflow Configuration (Environment Variables)

You'll find all these on the SatisPress settings page

| name    | value                                                                            |
| ------- | -------------------------------------------------------------------------------- |
| require | empty: workflow copies package name, 1: workflow copies composer require command |
| key     | API Key                                                                          |
| url     | package.json URL                                                                 |
| vendor  | Custom Vendor *(optional)*                                                       |

## License

MIT © [woda](https://www.woda.at)
