# Message Trends
A script designed to track usage count of certain words (currently designed for exported Discord messages)

It shows total word count (per tracked word) by author, word usage rate across all messages by that author, and the week in which they used that word the most.

Additionally, the script generates a csv file for each tracked word with the usage count per author per week for graphing.

## Usage
 - Install Node.js and NPM
 - Download or clone the repo
 - Export the messages you want to json using [DiscordChatExporter](https://github.com/Tyrrrz/DiscordChatExporter)
 - Run `npm install` to install dependencies
 - Run `node index.js` once to generate the `data` directory and put the json files in
 - Edit `words.json` to a string array of any regex
 - Run the script with `node index.js`
