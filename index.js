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
    // Create data loading directory and csv directory
    try
    {
        await fs.mkdir('data');
    } catch(ignored) {}
    try
    {
        await fs.mkdir('csv');
    } catch(ignored) {}
    
    // Load tracked words into array of regex (case insensitive and global)
    const words = JSON.parse(await fs.readFile('words.json', 'utf8')).map(word => new RegExp(word, 'ig'));
    
    // Read message data
    let messages = (await loadMessages('data')).filter(
        message => !(message.author.isBot || message.type !== 'Default' || message.content.length === 0));
    console.log(`Loaded ${messages.length} messages`);
    
    for(const word of words)
    {
        let authors = {};
        for(const message of messages)
        {
            if(!authors.hasOwnProperty(message.author.id))
            {
                authors[message.author.id] = {
                    name: message.author.name,
                    instances: [],
                    total: 0
                };
            }
            authors[message.author.id].total++;
            
            const matches = message.content.match(word);
            if(matches)
            {
                
                authors[message.author.id].instances.push({
                    date: new Date(message.timestamp),
                    count: matches.length
                });
            }
        }
        
        let authorArr = [];
        for(const id in authors)
        {
            if(!authors.hasOwnProperty(id))
            {
                continue;
            }
            
            authorArr.push(authors[id]);
        }
        
        // Sort authors by rate and the instances by date
        authorArr = authorArr.map(author =>
        {
            const wordTotal = author.instances.reduce((acc, current) => acc + current.count, 0);
            const rate = wordTotal / author.total;
            return {
                name: author.name,
                total: author.total,
                instances: author.instances.sort((a, b) => a.date - b.date),
                wordTotal,
                rate
            };
        }).sort((a, b) => b.rate - a.rate);
        
        // Set up a time range
        const earliest = authorArr.map(author => author.instances[0]).sort((a, b) => a.date - b.date)[0].date;
        const latest = authorArr.map(author => author.instances[author.instances.length - 1])
                                 .sort((a, b) => b.date - a.date)[0].date;
        const earliestWeek = new Date(earliest.getTime() - (earliest.getDay() * 24 * 60 * 60 * 1000));
        const latestWeek = new Date(latest.getTime() - ((6 - latest.getDay()) * 24 * 60 * 60 * 1000));
        
        let currentWeek = new Date(earliestWeek.getTime());
        let weeks = [];
        while(currentWeek < latestWeek)
        {
            const nextWeek = new Date(currentWeek.getTime() + (7 * 24 * 60 * 60 * 1000));
            weeks.push({
                week: currentWeek.getTime(),
                authors: authorArr.reduce((acc, current) =>
                {
                    acc[current.name] = current.instances
                                                .filter(instance => (instance.date >= currentWeek && instance.date < nextWeek))
                                                .reduce((acc, current) => acc + current.count, 0);
                    return acc;
                }, {})
            });
            currentWeek = nextWeek;
        }
        
        console.log(`${word.source}:`);
        console.table(authorArr.map(author =>
        {
            const apex = weeks.sort((a, b) => b.authors[author.name] - a.authors[author.name])[0];
            return {
                name: author.name,
                total: author.wordTotal,
                'rate %': Number((author.rate * 100).toFixed(2)),
                apex: `${apex.authors[author.name]} week of ${(new Date(apex.week)).toString().match(/.+?\d{4}/g)[0]}`
            };
        }));
        console.log('');
    }
})();
