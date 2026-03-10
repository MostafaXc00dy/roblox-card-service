const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');
const FormData = require('form-data');
const app = express();

app.use(express.json());

const WEBHOOK_URL = "https://discord.com/api/webhooks/1480757143643885589/EkuWybvlwBe78JtV8WpdpPPF_5BcOGpfWrF700-RNtQ_RAtNAcNOMbRRU2eZSYsMalXU";

async function getAvatar(userId) {
    const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`;
    const res = await axios.get(url);
    return res.data.data[0].imageUrl;
}

app.post('/generate', async (req, res) => {
    try {
        const { userId1, userId2, amount } = req.body;

        const [url1, url2] = await Promise.all([getAvatar(userId1), getAvatar(userId2)]);
        const [img1, img2, robuxIcon] = await Promise.all([
            loadImage(url1),
            loadImage(url2),
            loadImage('https://files.catbox.moe/979b22.png')
        ]);

        const canvas = createCanvas(800, 300);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#1e1f22';
        ctx.roundRect(10, 10, 780, 280, 20);
        ctx.fill();

        function drawPlayer(img, x, y) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x + 75, y + 75, 75, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, x, y, 150, 150);
            ctx.restore();
            // Stroke وردي
            ctx.strokeStyle = '#eb459e';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(x + 75, y + 75, 75, 0, Math.PI * 2);
            ctx.stroke();
        }

        drawPlayer(img1, 50, 75);
        drawPlayer(img2, 600, 75);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.drawImage(robuxIcon, 300, 70, 60, 60);
        ctx.fillText(amount, 430, 115);
        ctx.font = '35px Arial';
        ctx.fillText('donated to', 400, 180);

        const buffer = canvas.toBuffer('image/png');
        const form = new FormData();
        form.append('file', buffer, 'card.png');
        form.append('payload_json', JSON.stringify({
            embeds: [{
                image: { url: 'attachment://card.png' },
                color: 0xeb459e
            }]
        }));

        await axios.post(WEBHOOK_URL, form, { headers: form.getHeaders() });
        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to generate card" });
    }
});

app.listen(process.env.PORT || 3000, () => console.log("Server Running"));
