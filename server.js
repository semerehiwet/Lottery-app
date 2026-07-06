const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// የአንድ እጣ ዋጋ
const TICKET_PRICE = 2500;

// የ Chapa የሙከራ ቁልፍ (ከ Chapa Dashboard የምታገኘው)
// ለአሁኑ በ Chapa መለያህ መተካት ትችላለህ
const CHAPA_SECRET_KEY = "CHASECK_TEST-xxxxxxxxxxxxxxxxxxxx"; 

// 1. ክፍያ ለመጀመር የሚጠራ API
app.post('/api/pay', async (req, res) => {
    const { fullName, phoneNumber, amount } = req.body;

    // የዕጣ ቁጥር ስሌት (ለማረጋገጫ ያህል)
    const ticketsCount = Math.floor(amount / TICKET_PRICE);
    if (ticketsCount < 1) {
        return res.status(400).json({ error: "ያስገቡት ገንዘብ ለአንድ እጣ በቂ አይደለም" });
    }

    // ለ Chapa የሚላክ መረጃ
    const chapaData = {
        amount: amount,
        currency: "ETB",
        email: "user@example.com", // Chapa ኢሜይል ስለሚፈልግ ግዴታ ነው
        first_name: fullName,
        phone_number: phoneNumber,
        tx_ref: `chewata-${Date.now()}`, // ለእያንዳንዱ ክፍያ የሚሰጥ ልዩ መለያ ቁጥር
        callback_url: "https://your-netlify-site.netlify.app/", // ክፍያው ሲያልቅ ተጠቃሚው የሚመለስበት ቦታ
        customization: {
            title: "የዕጣ ቁጥር መግዣ",
            description: `${ticketsCount} እጣ ለመግዛት የተደረገ ክፍያ`
        }
    };

    try {
        // ወደ Chapa API መላክ
        const response = await fetch("https://api.chapa.co/v1/transaction/initialize", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${CHAPA_SECRET_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(chapaData)
        });

        const result = await response.json();

        if (result.status === "success") {
            // ለ Netlify UI የ Chapa መክፈያ ሊንክ መላክ
            res.json({ checkout_url: result.data.checkout_url });
        } else {
            res.status(400).json({ error: "Chapa ክፍያውን መጀመር አልቻለም" });
        }
    } catch (error) {
        res.status(500).json({ error: "የሰርቨር ስህተት አጋጥሟል" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
