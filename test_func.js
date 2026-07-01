function generateAIResponse(userMessage) {
                const raw = (userMessage || '').toLowerCase().trim();
                const data = aiChatData[currentLang] || aiChatData['en'];
                const subs = (template) => template
                    .replace(/\$\{phone\}/g, data.phone)
                    .replace(/\$\{email\}/g, data.email)
                    .replace(/\$\{address\}/g, data.address)
                    .replace(/\$\{workingHours\}/g, data.workingHours)
                    .replace(/\$\{fullName\}/g, data.fullName)
                    .replace(/\$\{description\}/g, data.description)
                    .replace(/\$\{products\.length\}/g, data.products.length)
                    .replace(/\$\{services\.length\}/g, data.services.length);

                // Strip diacritics for tolerant matching (e.g., "çfarë" ≈ "cfare")
                const norm = raw.normalize('NFD').replace(/\p{Diacritic}/gu, '');

                // Score-based intent detection. Each keyword contributes to a topic's score.
                // Highest-scoring topic wins; tie-breaks follow array order.
                // Topics: phone, email, address, hours, products, services, price, features, order, stats, about, greeting, thanks, clarification, fallback
                const topics = {
                    phone: 0,
                    email: 0,
                    address: 0,
                    hours: 0,
                    products: 0,
                    services: 0,
                    price: 0,
                    features: 0,
                    order: 0,
                    stats: 0,
                    about: 0,
                    thanks: 0
                };

                // -- GREETINGS / THANKS (separate flow, not scored) --
                const greetingRe = /^(pershendetje|miredita|mirembrema|tung|tungjatjeta|mire|përshëndetje|hello|hi|hey|good morning|good afternoon|good evening|howdy|hallo|guten morgen|guten tag|guten abend|hi there|bonjour|salut|bonsoir|buongiorno|buonasera|ciao)\b/;
                if (greetingRe.test(raw) || greetingRe.test(norm)) {
                    return subs(data.greeting);
                }
                const thanksRe = /\b(faleminderit|thank you|thanks|merci|danke|grazie|gracias|thx)\b/;
                if (thanksRe.test(raw) || thanksRe.test(norm)) {
                    return data.thanks;
                }

                // -- PHONE / CALL (specific word-boundary keywords only) --
                // Avoiding 2-3 char false positives like "nr" or "tel" that match inside unrelated words.
                const phoneKw = [
                    /\bnr\.?\s*i\s*telefonit\b/,
                    /\bnumri\s+i\s+telefonit\b/,
                    /\bnumrin\s+e\s+telefonit\b/,
                    /\bnumrin\s+tuaj\b/,
                    /\bnumri\s+juaj\b/,
                    /\bnumrin\s+telefonit\b/,
                    /\bphone\s+number\b/,
                    /\bphone\s*\b/,
                    /\btelephone\s+number\b/,
                    /\btelefonnummer\b/,
                    /\bnumero\s+di\s+telefono\b/,
                    /\bnumero\s+telefono\b/,
                    /\bnum[eé]ro\s+de\s+t[eé]l[eé]phone\b/,
                    /\bt[eé]l[eé]phone\b/,
                    /\btelefon(?:i|it|in|it?)\b/,
                    /\btelefono\b/,
                    /\bthirr(?:je|ni)?\b/,
                    /\bna\s+thirr(?:ni)?\b/,
                    /\bcan\s+you\s+call\b/,
                    /\bgive\s+me\s+a\s+call\b/,
                    /\bruf(?:t|en)?\s+(?:mich|sie|uns)\b/,
                    /\brufnummer\b/,
                    /\bappel(?:er|-moi|lez)\b/,
                    /\bappeler\b/,
                    /\bchiam(?:a|ami|ata)\b/,
                    /\bchiamaci\b/,
                    /\bsms\b/,
                    /\bwhatsapp\b/,
                    /\bviber\b/
                ];
                phoneKw.forEach(re => { if (re.test(raw) || re.test(norm)) topics.phone += 2; });
                if (/\bmund\s+t['']?ju\s+th(?:e|ë)rras\b/.test(raw) || /\bmund\s+t['']?ju\s+th(?:e|ë)rras\b/.test(norm)) topics.phone += 2;
                // Phone is also about the actual digits
                if (/\+383\b/.test(raw)) topics.phone += 5;

                // -- EMAIL --
                const emailKw = [
                    /\bemail\b/,
                    /\bemaili\b/,
                    /\bmail\b/,
                    /\be-?mail\b/,
                    /\bcourriel\b/,
                    /\bposta\s+elektronike\b/,
                    /\bcorreo\b/,
                    /\beposta\b/
                ];
                emailKw.forEach(re => { if (re.test(raw) || re.test(norm)) topics.email += 2; });
                if (/@gmail\b/.test(raw) || /@gmail\b/.test(norm)) topics.email += 5;

                // -- ADDRESS / LOCATION --
                // Use word-boundary keywords that are SPECIFIC to location, not generic "contact"
                const addressKw = [
                    /\baddress\b/,
                    /\baddressa\b/,
                    /\badres[aë]?\b/,
                    /\blokacioni\b/,
                    /\blokacion\b/,
                    /\bvenndodhja\b/,
                    /\bvenndodhje\b/,
                    /\bku\s+(?:ndodheni|jeni|ndodhet|gjendet)\b/,
                    /\bku\s+jete\b/,
                    /\bku\s+jetoni\b/,
                    /\bvendbanimi\b/,
                    /\bselenium\b/, // rare
                    /\bstay\b/, // ambiguous
                    /\bsituate?d?\b/,
                    /\blocated?\b/,
                    /\blocation\b/,
                    /\bwhere\s+are\s+you\b/,
                    /\bwhere\s+is\s+(?:your|the)\b/,
                    /\bwo\s+(?:sind|befindet|finde\s+ich)\b/,
                    /\bstandort\b/,
                    /\bwo\s+befindet\b/,
                    /\bwo\s+liegt\b/,
                    /\badresse\b/,
                    /\bubicazione\b/,
                    /\bdove\s+(?:siete|si\s+trova|vi\s+trovo)\b/,
                    /\bindirizzo\b/,
                    /\bo[uù]\s+(?:e[ts]tes[-\s]?vous|se\s+trouve|[ée]tes[-\s]?vous)\b/
                ];
                addressKw.forEach(re => { if (re.test(raw) || re.test(norm)) topics.address += 2; });
                // "Pozheran" / "Viti" is a strong address signal
                if (/\b(pozheran|viti)\b/.test(raw) || /\b(pozheran|viti)\b/.test(norm)) topics.address += 5;
                // "Google Maps" / "maps" questions point to address
                if (/\b(maps|google\s*maps|itin[eé]raire|directions|wegbeschreibung|indicazioni|percorso)\b/.test(raw) || /\b(maps|google\s*maps|itineraire|directions|wegbeschreibung|indicazioni|percorso)\b/.test(norm)) topics.address += 3;

                // -- WORKING HOURS --
                const hoursKw = [
                    /\borar(?:i|et|t)?\s+(?:i\s+)?pun(?:ës|es)\b/,
                    /\boraret\s+e\s+pun[eë]s\b/,
                    /\bworking\s+hours\b/,
                    /\bbusiness\s+hours\b/,
                    /\bopen(?:ing)?\s+hours\b/,
                    /\bwhen\s+(?:are\s+you|do\s+you)\s+open\b/,
                    /\boffnungszeiten\b/,
                    /\barbeitszeiten\b/,
                    /\bheures?\s+d['o]?uverture\b/,
                    /\borari(?:o)?\s+(?:di\s+)?(?:apertura|lavoro)\b/,
                    /\borario\b/,
                    /\bhoraires?\b/,
                    /\bkur\s+(?:punoni|jeni|hapeni|mbyllni)\b/,
                    /\bderi\s+kur\b/,
                    /\bnaga\s+cila\s+ore\b/,
                    /\bsa\s+ore\b/
                ];
                hoursKw.forEach(re => { if (re.test(raw) || re.test(norm)) topics.hours += 2; });
                // specific time-day combos
                if (/\b(e\s+h[eë]n[eë]|e\s+premte|e\s+mart[eë]|e\s+merkure|e\s+enjte|e\s+shtun[eë]|e\s+diel)\b/.test(norm)) topics.hours += 1;
                if (/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|luned[iì]|marted[iì]|mercoled[iì]|gioved[iì]|venerd[iì]|sabato|domenica)\b/.test(raw)) topics.hours += 1;
                if (/\b(08:00|09:00|16:30|17:00|18:00)\b/.test(raw)) topics.hours += 2;

                // -- PRODUCTS --
                const productKw = [
                    /\bprodukt(?:et|eve|in|it)?\b/,
                    /\bprodukte\b/,
                    /\bproduits?\b/,
                    /\bprodotto|prodotti\b/,
                    /\bqese(?:ve|t|te)?\b/,
                    /\bbag(?:s)?\b/,
                    /\bsac(?:s|che)?\b/,
                    /\bsacchetto|sacchetti\b/,
                    /\btaschen\b/,
                    /\bwhat\s+(?:do\s+you\s+(?:sell|offer|make|produce)|products?)\b/,
                    /\b(?:quels?|quali)\s+produits?\b/,
                    /\b(?:quali)\s+prodott[i]?\b/,
                    /\bwas\s+(?:bieten|produzieren|sind)\s+(?:sie|ihre)\b/,
                    /\bce\s+que\s+vous\s+(?:faites|produisez|vendez)\b/
                ];
                productKw.forEach(re => { if (re.test(raw) || re.test(norm)) topics.products += 2; });
                // specific bag types
                if (/\b(blerje|mbeturina|ushqimore|komposht|industriale|personalizuara|shopping|waste|food|compost|industrial|custom|spesa|rifiuti|alimentari|compostabili|industriali|personalizzati|einkauf|m[üu]ll|lebensmittel|kompost|individuell|industri)\b/.test(norm)) topics.products += 2;

                // -- SERVICES --
                const serviceKw = [
                    /\bsh[ëe]rbim(?:e|et|eve|it|in)?\b/,
                    /\bservices?\b/,
                    /\bservizi?\b/,
                    /\bdienstleistungen\b/,
                    /\bwhat\s+services?\b/,
                    /\bquels?\s+services?\b/,
                    /\bquali\s+serviz[i]?\b/,
                    /\bwas\s+(?:sind|ihre)\s+dienstleistungen\b/,
                    /\bofferta\b/,
                    /\bofferte\b/
                ];
                serviceKw.forEach(re => { if (re.test(raw) || re.test(norm)) topics.services += 2; });
                if (/\b(prodhim|distribution|certifikim|support|custom|fast|quality|24\/7)\b/.test(norm)) topics.services += 1;

                // -- PRICE / COST --
                const priceKw = [
                    /\b[cç]mim(?:i|et|eve|it)?\b/,
                    /\bpreis(?:e)?\b/,
                    /\bprix\b/,
                    /\bprezzo\b/,
                    /\bcost\b/,
                    /\bhow\s+much\b/,
                    /\bquanto\s+costa\b/,
                    /\bcombien\s+(?:co[uû]te|cela\s+co[uû]te)\b/,
                    /\bwas\s+kostet\b/,
                    /\bquote\b/,
                    /\bofert[aë]?\b/,
                    /\bbudget\b/,
                    /\bsa\s+kushton\b/,
                    /\bsa\s+(?:behet|duhet|kane)\b/
                ];
                priceKw.forEach(re => { if (re.test(raw) || re.test(norm)) topics.price += 2; });

                // -- FEATURES / QUALITY --
                const featureKw = [
                    /\bcil[eë]si\b/,
                    /\bqualit[eé]?\b/,
                    /\bquality\b/,
                    /\bfeatures?\b/,
                    /\bp[eë]rpar[eë]si\b/,
                    /\bavantages?\b/,
                    /\bvantaggi\b/,
                    /\bvorteile\b/,
                    /\bkarakteristika\b/,
                    /\bbiodegradueshme?\b/,
                    /\bbiod[eé]gradables?\b/,
                    /\bbiodegradabili\b/,
                    /\bbiologisch\s+abbaubar\b/,
                    /\bwhat\s+(?:are|is).{0,10}(?:advantage|benefit|feature)\b/,
                    /\b(?:pse)\b.*\b(zgjedhur|mirë)\b/
                ];
                featureKw.forEach(re => { if (re.test(raw) || re.test(norm)) topics.features += 2; });
                if (/\b(ecological|environment|green|eco|miqë|mjedis|nat[uü]r|umwelt|ambiente|environnement)\b/.test(norm)) topics.features += 1;

                // -- ORDER --
                const orderKw = [
                    /\bporosit[aë]?\b/,
                    /\bporosis\b/,
                    /\border\b/,
                    /\bord(?:ine|er|ini|ina)\b/,
                    /\bcommander\b/,
                    /\bcomm(?:ande|ander)\b/,
                    /\bbuy\b/,
                    /\bpurchase\b/,
                    /\bsi\s+porosit\b/,
                    /\bsi\s+(?:t['']?)?(?:b[eë]j|b[eë]jm[eë]|porosisni)\b/,
                    /\bhow\s+to\s+order\b/,
                    /\bcome\s+ordinare\b/,
                    /\bwie\s+(?:kann|bestelle)\b/,
                    /\bcomment\s+commander\b/,
                    /\bkomand[oë]?\b/
                ];
                orderKw.forEach(re => { if (re.test(raw) || re.test(norm)) topics.order += 2; });

                // -- STATS --
                const statsKw = [
                    /\bstatistika(?:t)?\b/,
                    /\bstatistik(?:a|en|en)?\b/,
                    /\bstatistiques?\b/,
                    /\bstatistiche?\b/,
                    /\bstats?\b/,
                    /\bnum[eë]r(?:i|it)?\b/,
                    /\bnumbers?\b/,
                    /\bsa\s+(?:klient|prodhon|qese|pem[ëe]|kemi)\b/,
                    /\bhow\s+many\b/,
                    /\bcombien\s+(?:de|avez|vous)\b/,
                    /\bquanti\b/,
                    /\bwieviele\b/,
                    /\bklient[eë]?\b/,
                    /\bclienti\b/,
                    /\bclient(?:s)?\b/,
                    /\bprodhim(?:i|it)?\b/,
                    /\bproduction\b/,
                    /\bproduzione\b/
                ];
                statsKw.forEach(re => { if (re.test(raw) || re.test(norm)) topics.stats += 2; });
                if (/\b(pem[ëe]|trees|alberi|b[aä]ume|arbres)\b/.test(norm)) topics.stats += 1;

                // -- ABOUT / COMPANY INFO --
                const aboutKw = [
                    /\brreth\s+(?:kompanis[eë]|nesh|nesh)\b/,
                    /\babout\s+(?:us|the\s+company|your\s+company)\b/,
                    /\b[cç]far[eë]\s+(?:esht[eë]|jeni|b[eë]ni)\b/,
                    /\bwho\s+are\s+you\b/,
                    /\bwhat\s+is\s+(?:this|your)\s+company\b/,
                    /\bkompania\b/,
                    /\bcompany\b/,
                    /\bunternehmen\b/,
                    /\bentreprise\b/,
                    /\bazienda\b/,
                    /\bübrigens\b/,
                    /\binfo(?:rmacion)?\b/,
                    /\binformation\b/,
                    /\binformacione?\b/,
                    /\binfos?\b/,
                    /\bhistor[yikë]?\b/,
                    /\bhistorik\b/
                ];
                aboutKw.forEach(re => { if (re.test(raw) || re.test(norm)) topics.about += 2; });
                // BioPackKos directly mentioned
                if (/\bbiopackkos\b/.test(norm)) topics.about += 1;

                // Penalty: if the word "all" / "everything" / "gjithçka" is in the message,
                // soften the scores so we don't lock onto a single word
                if (/\b(all|everything|gjith[cç]ka|alles|tout|tutta|alle)\b/.test(norm)) {
                    Object.keys(topics).forEach(k => { topics[k] = Math.max(0, topics[k] - 1); });
                }

                // Pick highest scoring topic
                const order = ['phone', 'email', 'address', 'hours', 'products', 'services', 'price', 'features', 'order', 'stats', 'about'];
                let best = null;
                let bestScore = 0;
                for (const t of order) {
                    if (topics[t] > bestScore) {
                        bestScore = topics[t];
                        best = t;
                    }
                }

                // Confidence threshold: if no topic scored meaningfully, ask for clarification
                if (!best || bestScore < 2) {
                    // If the user clearly just sent a single word or super short input, ask for clarification
                    if (raw.length <= 3) {
                        return data.clarification;
                    }
                    return subs(data.fallback);
                }

                switch (best) {
                    case 'phone':
                        return `📞 ${data.phoneLabel}: ${data.phone}\n\n${data.phoneMessage}`;
                    case 'email':
                        return `📧 ${data.emailLabel}: ${data.email}\n\n${data.emailMessage}`;
                    case 'address':
                        return `📍 ${data.addressLabel}: ${data.address}\n\n${data.addressMessage}`;
                    case 'hours':
                        return `🕐 ${data.workingHoursLabel}: ${data.workingHours}\n\n${data.workingHoursMessage}`;
                    case 'products':
                        return `📦 ${data.productsLabel}:\n\n${data.products.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n${data.productsMessage}`;
                    case 'services':
                        return `⚙️ ${data.servicesLabel}:\n\n${data.services.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n${data.servicesMessage}`;
                    case 'price':
                        return `💰 ${data.priceLabel}\n\n${data.priceMessage}\n\nFor a personalized quote:\n📞 ${data.phone}\n📧 ${data.email}`;
                    case 'features':
                        return `✨ ${data.featuresLabel}:\n\n${data.features.map(f => `✓ ${f}`).join('\n')}\n\n${data.featuresMessage}`;
                    case 'order':
                        return `🛒 ${data.orderLabel}:\n\n${subs(data.orderMessage)}`;
                    case 'stats':
                        return `📊 ${data.statsLabel}:\n\n🌳 ${data.stats.treesSaved} ${data.treesSavedLabel}\n👥 ${data.stats.clients} ${data.clientsLabel}\n📦 ${data.stats.dailyProduction} ${data.dailyProductionLabel}\n🌍 ${data.stats.exportCountries} ${data.exportCountriesLabel}`;
                    case 'about':
                        return subs(data.about);
                    default:
                        return subs(data.fallback);
                }
            }