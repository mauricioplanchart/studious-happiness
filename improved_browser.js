// IMPROVED BROWSER SYSTEM - Paste this over the BrowserUI class
// This replacement adds:
// - Tab support (multiple tabs)
// - Back/Forward history navigation
// - Improved UI with better buttons
// - 8 new website simulations (LinkedIn, Netflix, Twitch, Facebook, Instagram)

// Enhanced drawSiteContent() method
function drawSiteContentImproved() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const contentStart = 85;
    ctx.textAlign = 'center';

    const drawDefaultWithLoading = () => {
        if (this.isLoading) {
            ctx.fillStyle = '#999';
            ctx.font = '24px Arial';
            ctx.fillText('Loading...', w / 2, contentStart + 100);
        } else {
            ctx.fillStyle = '#666';
            ctx.font = '20px Arial';
            ctx.fillText('Content loaded ✓', w / 2, contentStart + 100);
        }
    };

    switch (this.currentSite) {
        case 'google':
            ctx.fillStyle = '#4a90e2';
            ctx.font = 'bold 72px Arial';
            ctx.fillText('G', w / 2 - 150, contentStart + 150);
            ctx.fillStyle = '#ea4335';
            ctx.fillText('o', w / 2 - 60, contentStart + 150);
            ctx.fillStyle = '#fbbc04';
            ctx.fillText('o', w / 2 + 30, contentStart + 150);
            ctx.fillStyle = '#4a90e2';
            ctx.fillText('g', w / 2 + 120, contentStart + 150);
            ctx.fillStyle = '#ea4335';
            ctx.fillText('l', w / 2 + 195, contentStart + 150);
            ctx.fillStyle = '#34a853';
            ctx.fillText('e', w / 2 + 255, contentStart + 150);

            ctx.fillStyle = '#f1f3f4';
            ctx.strokeStyle = '#dadce0';
            ctx.lineWidth = 2;
            ctx.fillRect(w / 2 - 250, contentStart + 200, 500, 50);
            ctx.strokeRect(w / 2 - 250, contentStart + 200, 500, 50);
            ctx.fillStyle = '#999999';
            ctx.font = '18px Arial';
            ctx.fillText('Search Google...', w / 2, contentStart + 232);
            break;

        case 'youtube':
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(w / 2 - 100, contentStart + 50, 200, 140);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(w / 2 - 30, contentStart + 90);
            ctx.lineTo(w / 2 + 40, contentStart + 120);
            ctx.lineTo(w / 2 - 30, contentStart + 150);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 48px Arial';
            ctx.fillText('YouTube', w / 2, contentStart + 250);
            for (let i = 0; i < 6; i++) {
                const x = (i % 3) * 320 + 50;
                const y = Math.floor(i / 3) * 200 + contentStart + 300;
                ctx.fillStyle = '#e0e0e0';
                ctx.fillRect(x, y, 280, 160);
                ctx.fillStyle = '#666666';
                ctx.font = '14px Arial';
                ctx.textAlign = 'left';
                ctx.fillText('Video Title', x + 10, y + 185);
            }
            break;

        case 'wikipedia':
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 64px serif';
            ctx.textAlign = 'center';
            ctx.fillText('W', w / 2, contentStart + 100);
            ctx.font = 'bold 48px serif';
            ctx.fillText('WIKIPEDIA', w / 2, contentStart + 170);
            ctx.font = '20px serif';
            ctx.fillStyle = '#666666';
            ctx.fillText('The Free Encyclopedia', w / 2, contentStart + 210);
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#a2a9b1';
            ctx.lineWidth = 2;
            ctx.fillRect(w / 2 - 250, contentStart + 250, 500, 50);
            ctx.strokeRect(w / 2 - 250, contentStart + 250, 500, 50);
            ctx.textAlign = 'left';
            ctx.fillStyle = '#000000';
            ctx.font = '16px serif';
            const lines = ['Featured Article', '', 'Lorem ipsum dolor sit amet'];
            lines.forEach((line, i) => {
                ctx.fillText(line, 100, contentStart + 350 + i * 30);
            });
            break;

        case 'github':
            ctx.fillStyle = '#24292e';
            ctx.fillRect(0, contentStart, w, 60);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('GitHub', 40, contentStart + 40);
            ctx.fillStyle = '#0366d6';
            ctx.font = 'bold 28px Arial';
            ctx.fillText('user/repository', 100, contentStart + 150);
            ctx.fillStyle = '#586069';
            ctx.font = '18px Arial';
            ctx.fillText('Public repository', 100, contentStart + 190);
            ctx.fillStyle = '#f6f8fa';
            ctx.fillRect(80, contentStart + 230, w - 160, 300);
            ctx.fillStyle = '#24292e';
            ctx.font = '16px monospace';
            ['README.md', 'src/', 'package.json'].forEach((line, i) => {
                ctx.fillText(line, 100, contentStart + 270 + i * 40);
            });
            break;

        case 'twitter':
            ctx.fillStyle = '#1da1f2';
            ctx.fillRect(0, contentStart, w, 60);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 42px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('X', w / 2, contentStart + 45);
            for (let i = 0; i < 3; i++) {
                const y = contentStart + 130 + i * 120;
                ctx.fillStyle = '#f7f9fa';
                ctx.fillRect(100, y, w - 200, 110);
                ctx.fillStyle = '#14171a';
                ctx.font = 'bold 18px Arial';
                ctx.textAlign = 'left';
                ctx.fillText('@user' + i, 120, y + 25);
                ctx.font = '16px Arial';
                ctx.fillStyle = '#657786';
                ctx.fillText('Tweet content here...', 120, y + 55);
            }
            break;

        case 'reddit':
            ctx.fillStyle = '#ff4500';
            ctx.fillRect(0, contentStart, w, 60);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('reddit', 40, contentStart + 40);
            for (let i = 0; i < 4; i++) {
                const y = contentStart + 130 + i * 110;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(50, y, w - 100, 100);
                ctx.strokeStyle = '#ccc';
                ctx.lineWidth = 1;
                ctx.strokeRect(50, y, w - 100, 100);
                ctx.fillStyle = '#1c1c1c';
                ctx.font = 'bold 18px Arial';
                ctx.fillText('Post title ' + (i + 1), 70, y + 30);
                ctx.font = '14px Arial';
                ctx.fillStyle = '#787c7e';
                ctx.fillText('r/subreddit • Posted by u/user', 70, y + 55);
            }
            break;

        case 'amazon':
            ctx.fillStyle = '#232f3e';
            ctx.fillRect(0, contentStart, w, 60);
            ctx.fillStyle = '#ff9900';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('amazon', 40, contentStart + 40);
            for (let i = 0; i < 6; i++) {
                const x = (i % 3) * 320 + 50;
                const y = Math.floor(i / 3) * 240 + contentStart + 130;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x, y, 280, 220);
                ctx.strokeStyle = '#ddd';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, 280, 220);
                ctx.fillStyle = '#e0e0e0';
                ctx.fillRect(x + 20, y + 20, 240, 140);
                ctx.fillStyle = '#000000';
                ctx.font = '14px Arial';
                ctx.textAlign = 'left';
                ctx.fillText('Product', x + 20, y + 170);
                ctx.fillStyle = '#b12704';
                ctx.font = 'bold 18px Arial';
                ctx.fillText('$99.99', x + 20, y + 200);
            }
            break;

        case 'linkedin':
            ctx.fillStyle = '#0a66c2';
            ctx.fillRect(0, contentStart, w, 60);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('LinkedIn', 40, contentStart + 40);
            for (let i = 0; i < 3; i++) {
                const y = contentStart + 130 + i * 130;
                ctx.fillStyle = '#f3f2ef';
                ctx.fillRect(50, y, w - 100, 120);
                ctx.strokeStyle = '#d5d4cf';
                ctx.lineWidth = 1;
                ctx.strokeRect(50, y, w - 100, 120);
                ctx.fillStyle = '#0a66c2';
                ctx.font = 'bold 18px Arial';
                ctx.textAlign = 'left';
                ctx.fillText('John Doe', 70, y + 30);
                ctx.font = '14px Arial';
                ctx.fillStyle = '#666';
                ctx.fillText('Professional Update', 70, y + 55);
                ctx.fillText('Just completed an amazing project!', 70, y + 85);
            }
            break;

        case 'netflix':
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, contentStart, w, 60);
            ctx.fillStyle = '#e50914';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('NETFLIX', 40, contentStart + 40);
            ctx.font = '18px Arial';
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.fillText('Trending Now', w / 2, contentStart + 120);
            for (let i = 0; i < 6; i++) {
                const x = (i % 3) * 320 + 80;
                const y = Math.floor(i / 3) * 200 + contentStart + 160;
                ctx.fillStyle = '#333';
                ctx.fillRect(x, y, 250, 160);
                ctx.fillStyle = '#e50914';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Show ' + (i + 1), x + 125, y + 80);
            }
            break;

        case 'twitch':
            ctx.fillStyle = '#9146ff';
            ctx.fillRect(0, contentStart, w, 60);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('Twitch', 40, contentStart + 40);
            ctx.fillStyle = '#1f1f23';
            for (let i = 0; i < 6; i++) {
                const x = (i % 3) * 320 + 80;
                const y = Math.floor(i / 3) * 200 + contentStart + 140;
                ctx.fillRect(x, y, 250, 160);
                ctx.fillStyle = '#9146ff';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Stream ' + (i + 1), x + 125, y + 80);
                ctx.fillStyle = '#1f1f23';
            }
            break;

        case 'facebook':
            ctx.fillStyle = '#1877f2';
            ctx.fillRect(0, contentStart, w, 60);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('f', 40, contentStart + 40);
            for (let i = 0; i < 3; i++) {
                const y = contentStart + 130 + i * 130;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(50, y, w - 100, 120);
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                ctx.strokeRect(50, y, w - 100, 120);
                ctx.fillStyle = '#1f2937';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'left';
                ctx.fillText('User Name', 70, y + 30);
                ctx.font = '14px Arial';
                ctx.fillStyle = '#6b7280';
                ctx.fillText('Just shared a new post', 70, y + 55);
                ctx.fillText('2 hours ago', 70, y + 85);
            }
            break;

        case 'instagram':
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, contentStart, w, 60);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'italic bold 32px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('Instagram', 40, contentStart + 40);
            for (let i = 0; i < 4; i++) {
                const x = (i % 2) * 480 + 80;
                const y = Math.floor(i / 2) * 220 + contentStart + 130;
                ctx.fillStyle = '#262626';
                ctx.fillRect(x, y, 440, 200);
                ctx.fillStyle = '#e0e0e0';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('photo_' + (i + 1), x + 220, y + 100);
                ctx.fillStyle = '#888';
                ctx.font = '12px Arial';
                ctx.fillText('❤ likes', x + 220, y + 180);
            }
            break;

        default:
            ctx.fillStyle = '#333333';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Website Loaded', w / 2, contentStart + 150);
            ctx.font = '18px Arial';
            ctx.fillStyle = '#666666';
            ctx.fillText(this.getTitleFromURL(this.currentURL), w / 2, contentStart + 220);
            drawDefaultWithLoading();
            break;
    }
}
