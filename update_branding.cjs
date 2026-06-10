const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      filelist.push(path.join(dir, file));
    }
  });
  return filelist;
};

const allFiles = walkSync(path.join(__dirname, 'src'));

for (const file of allFiles) {
  if (file.endsWith('.astro') || file.endsWith('.ts')) {
    let content = fs.readFileSync(file, 'utf-8');
    let original = content;

    // Replace branding
    content = content.replace(/MiniSuper Admin/g, "MiniSuper KRN");
    content = content.replace(/\| MiniSuper</g, "| MiniSuper KRN<");
    content = content.replace(/MiniSuper - Factura/g, "MiniSuper KRN - Factura");
    content = content.replace(/Factura_MiniSuper/g, "Factura_MiniSuper_KRN");
    content = content.replace(/un Mini Supermercado/gi, "MiniSuper KRN");
    content = content.replace(/>MiniSuper</g, ">MiniSuper KRN<");

    // Replace currency ($ to Bs. inside template literals and raw strings)
    // Common pattern: `$${`
    content = content.replace(/\$\$\{/g, "Bs. ${");
    // Some literal strings: `$${item` -> wait, `$${` covers it.
    // Replace `$${Number` -> covered by above.

    // If there is any other `$` for currency:
    // e.g. "Total cobrado: $"
    content = content.replace(/Total cobrado: \$/g, "Total cobrado: Bs. ");
    
    // Replace icon with image in login.astro
    if (file.endsWith('login.astro')) {
      const oldIcon = `<div class="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 70px; height: 70px; background: var(--accent-gradient);">
        <i class="bi bi-shop text-white fs-1"></i>
      </div>`;
      const newLogo = `<div class="mb-3 d-flex justify-content-center">
        <img src="/images/logo.png" alt="MiniSuper KRN Logo" class="img-fluid rounded shadow-sm" style="max-height: 120px; object-fit: contain; border: 2px solid var(--glass-border);">
      </div>`;
      content = content.replace(oldIcon, newLogo);
      
      // Some indent might mismatch, let's also do a looser replace if exact fails
      if (content === original) {
        content = content.replace(/<div class="rounded-circle d-inline-flex[\s\S]*?<\/div>/, newLogo);
      }
    }

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf-8');
      console.log(`Updated ${file}`);
    }
  }
}
