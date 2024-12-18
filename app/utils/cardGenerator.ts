interface ExpDate {
    month: string;
    year: string;
}

interface GeneratedCard {
    number: string;
    exp: ExpDate;
    cvv: string;
    formatted: string;
}

function luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i]);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
}

function generateLuhnNumber(partialNumber: string): string {
    let sum = 0;
    let isEven = true;

    for (let i = partialNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(partialNumber[i]);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    const checksum = (10 - (sum % 10)) % 10;
    return partialNumber + checksum;
}

function generateCard(bin: string): string {
    if (!/^[0-9x]+$/.test(bin)) {
        throw new Error('BIN inválido: solo se permiten números y "x"');
    }

    let baseNumber = '';
    for (let i = 0; i < 15; i++) {
        if (i < bin.length) {
            baseNumber += bin[i] === 'x' ? Math.floor(Math.random() * 10) : bin[i];
        } else {
            baseNumber += Math.floor(Math.random() * 10);
        }
    }

    return generateLuhnNumber(baseNumber);
}

function generateExpDate(): ExpDate {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const year = currentYear + Math.floor(Math.random() * 5);
    
    let month;
    if (year === currentYear) {
        month = currentMonth + Math.floor(Math.random() * (12 - currentMonth + 1));
    } else {
        month = Math.floor(Math.random() * 12) + 1;
    }

    return {
        month: month.toString().padStart(2, '0'),
        year: year.toString()
    };
}

function generateCVV(): string {
    return Math.floor(Math.random() * 900 + 100).toString();
}

function generateCards(bin: string, amount = 1, customExp: string | 'rnd' | null = null, customCVV: string | 'rnd' | null = null): GeneratedCard[] {
    const cards: GeneratedCard[] = [];
    
    for (let i = 0; i < amount; i++) {
        try {
            const cardNumber = generateCard(bin);
            const exp = customExp === 'rnd' ? generateExpDate() : 
                       customExp ? {
                           month: customExp.split('/')[0],
                           year: customExp.split('/')[1]
                       } : generateExpDate();
            
            const cvv = customCVV === 'rnd' ? generateCVV() : 
                       customCVV || generateCVV();

            cards.push({
                number: cardNumber,
                exp: exp,
                cvv: cvv,
                formatted: `${cardNumber}|${exp.month}|${exp.year}|${cvv}`
            });
        } catch (error) {
            console.error('Error generando tarjeta:', error);
            i--;
        }
    }

    return cards;
}

export {
    generateCards,
    luhnCheck,
    type GeneratedCard,
    type ExpDate
}; 