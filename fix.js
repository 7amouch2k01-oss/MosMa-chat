const fs = require('fs');
const path = require('path');

function findFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('_auth_backups')) {
      results = results.concat(findFiles(file));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = findFiles('c:/Users/mosma/OneDrive/Desktop/chat application/client/src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  const oldStr1 = "const BACKEND_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);";
  const newStr1 = "const BACKEND_URL = import.meta.env.PROD ? window.location.origin : `${window.location.protocol}//${window.location.hostname}:5000`;";

  if (content.includes(oldStr1)) {
    content = content.replace(oldStr1, newStr1);
    modified = true;
  }

  const oldStr2 = "const apiUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);";
  const newStr2 = "const apiUrl = import.meta.env.PROD ? window.location.origin : `${window.location.protocol}//${window.location.hostname}:5000`;";

  if (content.includes(oldStr2)) {
    content = content.replace(oldStr2, newStr2);
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(file, content);
    console.log('Updated: ' + file);
  }
});
