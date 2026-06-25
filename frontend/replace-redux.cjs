const fs = require('fs');
const path = require('path');

const directory = 'e:/Bcc Seo/frontend/src/pages/New Task';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (content.includes('import { useSelector } from "react-redux";') || content.includes('import { useSelector, useDispatch } from "react-redux";') || content.includes("import { useSelector } from 'react-redux';")) {
    content = content.replace(/import \{ useSelector \} from ['"]react-redux['"];\r?\n?/g, '');
    content = content.replace(/import \{ useSelector, useDispatch \} from ['"]react-redux['"];\r?\n?/g, '');
    
    if (!content.includes('import { useAuth }')) {
       content = 'import { useAuth } from "../../contexts/AuthContext";\n' + content;
    }
    changed = true;
  }

  if (content.includes('useSelector((state) => state.auth.user)') || content.includes('useSelector(state => state.auth.user)') || content.includes('useSelector((state)=>state.auth.user)')) {
    content = content.replace(/const (\w+) = useSelector\(\(state\) => state\.auth\.user\);/g, 'const { user: $1 } = useAuth();');
    content = content.replace(/const (\w+) = useSelector\(state => state\.auth\.user\);/g, 'const { user: $1 } = useAuth();');
    changed = true;
  }

  if (content.includes('useDispatch()')) {
    content = content.replace(/const dispatch = useDispatch\(\);\r?\n?/g, '');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Updated ' + filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

walkDir(directory);
