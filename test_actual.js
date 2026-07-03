// Mock data
const aiChatData = {
    'en': {
        company: "BioPackKos",
        fullName: "BioPackKos - Biodegradable Bags",
        products: ["a","b","c","d","e","f"],
        services: ["a","b","c","d"],
        address: "Pozheran, Viti-Kosovo",
        phone: "+383 44 450 505",
        email: "biopackkos@gmail.com",
        workingHours: "Monday - Friday: 08:00 - 16:30",
        features: ["a","b","c","d"],
        stats: { treesSaved: "1,500", clients: "500+", dailyProduction: "50,000", exportCountries: "5" },
        description: "BioPackKos",
        treesSavedLabel: "trees saved per year",
        clientsLabel: "satisfied clients",
        dailyProductionLabel: "bags produced daily",
        exportCountriesLabel: "countries we export to",
        phoneLabel: "Phone number", phoneMessage: "Call us!",
        emailLabel: "Email", emailMessage: "Email us!",
        addressLabel: "Address", addressMessage: "We are in Pozheran!",
        workingHoursLabel: "Working hours", workingHoursMessage: "Mon-Fri",
        companyNameLabel: "Company name", companyNameMessage: "BioPackKos",
        productsLabel: "Products", productsMessage: "All biodegradable",
        servicesLabel: "Services", servicesMessage: "All services",
        priceLabel: "Price", priceMessage: "Contact us",
        featuresLabel: "Features", featuresMessage: "European quality",
        orderLabel: "To order", orderMessage: "Contact: ${phone}, ${email}",
        statsLabel: "Stats",
        greeting: "Hello!",
        about: "${fullName}, ${description}, ${address}, ${phone}, ${email}, ${features}",
        orderFallback: "Order: ${phone}, ${email}",
        clarification: "Please clarify",
        fallback: "Contact ${phone}, ${email}",
        thanks: "You're welcome",
        typingMessage: "Typing...",
        assistantTitle: "AI", assistantSubtitle: "BioPackKos",
        initialGreeting: "Hello",
        inputPlaceholder: "Ask"
    },
    'sq': {
        company: "BioPackKos",
        fullName: "BioPackKos",
        products: ["a","b","c","d","e","f"],
        services: ["a","b","c","d"],
        address: "Pozheran, Viti-Kosovo",
        phone: "+383 44 450 505",
        email: "biopackkos@gmail.com",
        workingHours: "E Hënë - E Premte: 08:00 - 16:30",
        features: ["a","b","c","d"],
        stats: { treesSaved: "1,500", clients: "500+", dailyProduction: "50,000", exportCountries: "5" },
        description: "BioPackKos",
        treesSavedLabel: "pema të shpëtuara në vit",
        clientsLabel: "klientë të kënaqur",
        dailyProductionLabel: "qese të prodhuara çditë",
        exportCountriesLabel: "vende ku eksportojmë",
        phoneLabel: "Numri i telefonit", phoneMessage: "Thirrni!",
        emailLabel: "Email", emailMessage: "Dërgoni!",
        addressLabel: "Adresa", addressMessage: "Jemi në Pozheran!",
        workingHoursLabel: "Oraret e punës", workingHoursMessage: "E Hënë-E Premte",
        companyNameLabel: "Emri", companyNameMessage: "BioPackKos",
        productsLabel: "Produktet", productsMessage: "Biodegradueshme",
        servicesLabel: "Shërbimet", servicesMessage: "Profesionale",
        priceLabel: "Çmimet", priceMessage: "Kontaktoni",
        featuresLabel: "Përparësitë", featuresMessage: "Cilësi",
        orderLabel: "Për porosi", orderMessage: "Kontakt: ${phone}, ${email}",
        statsLabel: "Statistikat",
        greeting: "Përshëndetje!",
        about: "${fullName}, ${description}, ${address}, ${phone}, ${email}, ${features}",
        orderFallback: "Porosi: ${phone}, ${email}",
        clarification: "Qartësoni",
        fallback: "Kontakt ${phone}, ${email}",
        thanks: "Ju lutem",
        typingMessage: "Duke shkruar...",
        assistantTitle: "AI", assistantSubtitle: "BioPackKos",
        initialGreeting: "Përshëndetje",
        inputPlaceholder: "Pyesni"
    }
};

let currentLang = 'sq';

// Load the actual function
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const funcStart = html.indexOf('function generateAIResponse(userMessage)');
let depth = 0;
let i = funcStart;
let foundFirst = false;
while (i < html.length) {
    if (html[i] === '{') { depth++; foundFirst = true; }
    else if (html[i] === '}') { depth--; if (foundFirst && depth === 0) break; }
    i++;
}
const funcCode = html.substring(funcStart, i + 1);
eval(funcCode);

const tests = [
    ['sq', 'Ku ndodheni?', 'address'],
    ['sq', 'Lokacioni', 'address'],
    ['sq', 'Cili eshte lokacioni juaj?', 'address'],
    ['sq', 'Numri i telefonit', 'phone'],
    ['sq', 'Telefonata juaj', 'phone'],
    ['sq', 'Si mund tu kontaktoj?', 'fallback'],
    ['sq', 'Pozheran', 'address'],
    ['sq', 'Thirr', 'phone'],
    ['sq', 'a?', 'clarification'],
    ['sq', 'Cili eshte emaili juaj?', 'email'],
    ['sq', 'Sa kushtojne qeset?', 'price_or_products'],
    ['sq', 'Cilat jane produktet tuaja?', 'products'],
    ['sq', 'Si te porosis?', 'order'],
    ['sq', 'Sa klient keni?', 'stats'],
    ['sq', 'Cfare orari keni?', 'hours'],
    ['sq', 'Rreth kompanise', 'about'],
    ['sq', 'A jeni te hapur te shtunen?', 'hours'],
    ['en', 'Where are you?', 'address'],
    ['en', 'prezzi', 'fallback'],
    ['sq', 'Dove siete?', 'fallback'],
    ['sq', 'Përshëndetje', 'greeting'],
    ['sq', 'Faleminderit!', 'thanks'],
    ['en', 'Hello', 'greeting'],
    ['en', 'Phone number', 'phone'],
    ['en', 'your email?', 'email'],
    ['en', 'Working hours', 'hours'],
    ['de', 'Was sind ihre Produkte?', 'products'],
    ['de', 'Welche Dienstleistungen?', 'services'],
    ['fr', 'Comment commander', 'order'],
    ['it', 'Dove siete?', 'address']
];

let passed = 0, failed = 0;
tests.forEach(([lang, q, expected]) => {
    currentLang = lang;
    const r = generateAIResponse(q);
    const firstLine = r.split('\n')[0].substring(0, 80);
    console.log(`[${lang}] ${JSON.stringify(q).padEnd(38)} -> ${firstLine}`);
});
