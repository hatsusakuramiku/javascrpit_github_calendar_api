const http = require('http');
const https = require('https');

function listSplit(items, n) {
  return items.reduce((result, item, index) => {
    if (index % n === 0) {
      result.push([]);
    }
    result[result.length - 1].push(item);
    return result;
  }, []);
}

function getData(name) {
  return new Promise((resolve, reject) => {
    const url = `https://github.com/${name}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const datacenter = /data-date="(.*?)" data-level/g;
        const datacountreg = /<span class="sr-only">(.*?) contribution/g;

        const datadate = [...data.matchAll(datacenter)].map((match) => match[1]);
        const datacount = [...data.matchAll(datacountreg)].map((match) => {
          const count = parseInt(match[1]);
          return isNaN(count) ? 0 : count;
        });

        const sortedData = datadate.map((item, index) => ({
          date: item,
          count: datacount[index],
        })).sort((a, b) => a.date.localeCompare(b.date));

        const contributions = datacount.reduce((sum, count) => sum + count, 0);
        const datalistsplit = listSplit(sortedData, 7);

        const returndata = {
          total: contributions,
          contributions: datalistsplit,
        };

        resolve(returndata);
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

http.createServer((req, res) => {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const user = url.searchParams.get('user');

  getData(user)
  .then((data) => {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    });
    res.end(JSON.stringify(data));
  })
  .catch((error) => {
    res.writeHead(500, {
      'Content-Type': 'text/plain',
    });
    res.end(`Error: ${error.message}`);
  });
}).listen(8000, () => {
  console.log('Server started on port 8000');
});
