import youtubedl from 'youtube-dl-exec';
import fs from 'fs';

async function test() {
  try {
    const subprocess = youtubedl.exec('https://youtu.be/-dfmvdt34tM?si=k6OJkloILbUzJG4O', {
      f: 'best',
      o: '-'
    });
    
    let bytes = 0;
    subprocess.stdout.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > 100000) {
        console.log('Stream works! Downloaded > 100kb');
        subprocess.kill();
        process.exit(0);
      }
    });
    
  } catch(e) {
    console.error(e);
  }
}
test();
