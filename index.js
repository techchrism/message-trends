const fs = require('fs').promises;
const walk = require('walk');
const path = require('path');

async function loadMessages(dir)
{
    return new Promise((resolve, reject) =>
    {
        // Read the message data from all json files in the provided directory
        let messages = [];
        let walker = walk.walk(dir);
        walker.on('file', async (root, fileStats, next) =>
        {
            if(fileStats.name.endsWith('.json'))
            {
                messages = messages.concat(JSON.parse(await fs.readFile(path.join(root, fileStats.name), 'utf8'))['messages']);
            }
            next();
        });
    
        walker.on('errors', (root, nodeStatsArray, next) =>
        {
            next();
        });
        
        walker.on('end', () =>
        {
            resolve(messages);
        });
    });
}

(async () =>
{
    // Create data loading directory
    try
    {
        await fs.mkdir('data');
    } catch(ignored) {}
    
    // Read message data
    let messages = await loadMessages('data');
    console.log(`Loaded ${messages.length} messages`);
})();
