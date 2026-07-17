const fs = require('fs');
const path = require('path');

const walk = (dir, callback) => {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
};

const srcDir = path.join(__dirname, 'gody.vn', 'src');

walk(srcDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Replace fallback default
    if (content.includes("|| 'http://localhost:90/Project_DuLichMXH/public/api'")) {
      content = content.replace(/\|\|\s*'http:\/\/localhost:90\/Project_DuLichMXH\/public\/api'/g, "|| ''");
      changed = true;
    }

    // Replace direct base url variables in Group List/Detail pages
    if (content.includes("const baseUrl = 'http://localhost:90/Project_DuLichMXH/public';")) {
      content = content.replace(/const baseUrl = 'http:\/\/localhost:90\/Project_DuLichMXH\/public';/g, "const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\\/api$/, '');");
      changed = true;
    }

    // AdminBlogListPage
    if (content.includes("http://localhost:90/Project_DuLichMXH/public${")) {
       content = content.replace(/`http:\/\/localhost:90\/Project_DuLichMXH\/public\$\{([^}]+)\}`/g, "`${(import.meta.env.VITE_API_URL || '').replace(/\\/api$/, '')}${$1}`");
       changed = true;
    }

    // Specific replace for list images in DestinationDetailPage
    if (content.includes("http://localhost:90/63TinhThanhVN/")) {
       content = content.replace(/`http:\/\/localhost:90\/63TinhThanhVN/g, "`${(import.meta.env.VITE_API_URL || '').split('/Project_DuLichMXH')[0]}/63TinhThanhVN");
       changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
    }
  }
});
