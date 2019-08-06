const path = require(`path`);
const root = path.dirname(__dirname);

require(`@babel/register`)({
  root,
  extensions: [`.ts`],
  only: [p => p.startsWith(root)],
});

require(`./boot`);