const https = require('https');
const fs = require('fs');

const download = (url, dest) => {
  const file = fs.createWriteStream(dest);
  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${dest}`);
    });
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error(`Error downloading ${dest}:`, err.message);
  });
};

download('https://www.w3schools.com/html/mov_bbb.mp4', 'test_video.mp4');
download('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=200&fit=crop', 'test_thumbnail.jpg');
