const fs = require('fs');

async function run() {
  try {
    const res = await fetch('https://tgpcop-pharma.myshopify.com/products.json');
    const data = await res.json();
    
    let booksString = '  const studyBooks: StudyBook[] = [\n';
    
    data.products.forEach((p, index) => {
      // Try to determine year from tags or title
      let year = 'All';
      if (p.tags.includes('Semester 1') || p.tags.includes('Semester 2')) year = 'First Year';
      else if (p.tags.includes('Semester 3') || p.tags.includes('Semester 4')) year = 'Second Year';
      else if (p.tags.includes('Semester 5') || p.tags.includes('Semester 6')) year = 'Third Year';
      else if (p.tags.includes('Semester 7') || p.tags.includes('Semester 8')) year = 'Fourth Year';
      
      // Try to determine subject from tags (first tag that is not B.Pharm, RTMNU, TGPCOP, Semester X, etc.)
      const skipTags = ['B.Pharm', 'RTMNU', 'TGPCOP', 'Study Material', 'Semester Notes', 'GPAT'];
      let subject = 'Pharmacy Notes';
      for(const t of p.tags) {
        if (!skipTags.includes(t) && !t.startsWith('Semester')) {
          subject = t;
          break;
        }
      }
      
      const price = '₹' + parseInt(p.variants[0].price).toString();
      const image = p.images[0] ? p.images[0].src : 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?q=80&w=600&auto=format&fit=crop';
      const checkoutUrl = 'https://tgpcop-pharma.myshopify.com/products/' + p.handle;
      
      // Clean title
      let cleanTitle = p.title.replace('TGPCOP NOTES – ', '');
      
      booksString += `    {
      id: '${index + 1}',
      title: \`${cleanTitle.replace(/`/g, "\\`")}\`,
      subject: \`${subject.replace(/`/g, "\\`")}\`,
      price: '${price}',
      year: '${year}',
      image: '${image}',
      rating: '4.8',
      pages: 150,
      checkoutUrl: '${checkoutUrl}',
    },\n`;
    });
    
    booksString += '  ];';
    
    // Read Store.tsx
    let fileContent = fs.readFileSync('src/pages/Store.tsx', 'utf8');
    
    // Replace the array
    const regex = /const studyBooks: StudyBook\[\] = \[[\s\S]*?\];/;
    fileContent = fileContent.replace(regex, booksString);
    
    fs.writeFileSync('src/pages/Store.tsx', fileContent);
    console.log('Successfully updated Store.tsx with Shopify products!');
    
  } catch (err) {
    console.error(err);
  }
}

run();
