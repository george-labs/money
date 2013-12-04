'use strict';

var legend = {
        A: { index: 1, persona: 'SuperHero'},
        B: { index: 4, persona: 'SmartCookie'},
        C: { index: 3, persona: 'JollyJoker'},
        D: { index: 2, persona: 'Nonbeliever'},
        E: { index: 5, persona: 'BeanCounter'}
    },
    calculate = {
    'q1': function calculateQ1 (stack, answers) {
        /*
         6 correct answers (D)
         5 correct answers (E)
         4 correct answers (A)
         3 correct answers (B)
         less than 3 correct answers (C)
         */
        var verified = answers,
            mapping = [
                { key: 'q1s1',  value: { '1': 0, '2': 0, '3': 1, '4': 0, '5': 0 } },
                { key: 'q1s2',  value: { '1': 1, '2': 0, '3': 0, '4': 0, '5': 0 } },
                { key: 'q1s3',  value: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 1 } },
                { key: 'q1s4',  value: { '1': 0, '2': 0, '3': 1, '4': 0, '5': 0 } },
                { key: 'q1s5',  value: { '1': 0, '2': 0, '3': 1, '4': 0, '5': 0 } },
                { key: 'q1s6',  value: { '1': 0, '2': 1, '3': 0, '4': 0, '5': 0 } }
            ],
            conversion = ['C', 'C', 'C', 'B', 'A', 'E', 'D'],
            correct = 0;
        for (var i = mapping.length - 1; i >= 0 && verified; i -= 1) {
            var key = mapping[i].key,
                value = mapping[i].value;
            if (verified = verified && answers[key] && typeof value[answers[key]] === 'number') {
                correct += value[answers[key]];
            }
        }
        if (verified) {
            stack[conversion[correct]] += 1;
        }
        return !!verified;
    },
    'q2': function calculateQ2 (stack, answers) {
        /*
             1.  You save €100 every month. What would you rather do with the money?
                 + Put it in my piggy bank. (E)
                 + Transfer it into a savings account. (D)
                 + Invest in emerging market stocks. (B)
                 + Give it to my loved ones. (C)
                 + Invest in a mutual fund. (A)
             2.  You inherit €5,000 from your aunt. What would you do with the cash?
                 + Buy gold. (B)
                 + Buy federal bonds. (D)
                 + Leave it under the mattress. (E)
                 + Put it into a savings account. (A)
                 + Pack your bags and go on a weekend-trip to think about it. (C)
             3.  A business you invested in was sold last week. Your stake was valued at €800,000. What would you do with it?
                 + Put it into a savings account. (E)
                 + Invest in the stock market. (B)
                 + Buy bonds. (D)
                 + Invest in the business of a guy you met in a bar. (C)
                 + Open that restaurant that you have always dreamed about. (A)
         */
        var verified = answers,
            mapping = [
                {key: 'q2s1', value: {'1': 'E', '2': 'D', '3': 'B', '4': 'C', '5': 'A'} },
                {key: 'q2s2', value: {'1': 'B', '2': 'D', '3': 'E', '4': 'A', '5': 'C'} },
                {key: 'q2s3', value: {'1': 'E', '2': 'B', '3': 'D', '4': 'C', '5': 'A'} }
            ];
        for (var i = mapping.length - 1; i >= 0 && verified; i -= 1) {
            var key = mapping[i].key,
                value = mapping[i].value;
            if (verified = verified && answers[key] && value[answers[key]]) {
                stack[value[answers[key]]] += 1;
            }
        }
        return !!verified;
    },
    'q3': function calculateQ3 (stack, answers) {
        /*
            + You know exactly how much money you have in your account at all times.
                So me (D)          So not me (A, B, C, E)
            + You have a savings account, a current account and a secret place at home where you stash some cash. You loose control of your money sometimes.
                So me (C)          So not me (A, B, D, E)
            + You always know exactly how much cash you are carrying in your wallet.
                So me (D, E)       So not me (A, B, C)
         */
        var verified = answers,
            mapping = [
                { key: 'q3s1',  value: { '1': ['D'], '0': ['A', 'B', 'C', 'E'] } },
                { key: 'q3s2',  value: { '1': ['C'], '0': ['A', 'B', 'D', 'E'] } },
                { key: 'q3s3',  value: { '1': ['D', 'E'], '0': ['A', 'B', 'C'] } }
            ],
            stackable;
        for (var i = mapping.length - 1; i >= 0 && verified; i -= 1) {
            var key = mapping[i].key,
                value = mapping[i].value;
            if (verified = verified && answers[key] && value[answers[key]]) {
                stackable = value[answers[key]];
                for (var count in stackable) {
                    stack[stackable[count]] += 1;
                }
            }
        }
        return !!verified;
    },
    'q4': function calculateQ4 (stack, answers) {
        /*
            Card 1:  I don't really care about money. (C)
            Card 2:  I think long and hard before I spend my money. (A, D, E)
            Card 3:  I check my balance at least once a week. (A, D, E)
            Card 4:  Dealing with money frightens me. (D, E)
            Card 5:  Money calms me down. (B, C)
            Card 6:  I don’t trust anyone with my money. (E)
            Card 7:  Dealing with money numbs me. (C, E)
            Card 8:  I am well informed about money matters. (A, B, D)
            Card 9:  When it comes to money, you can never be too careful. (D, E)
            Card 10: My dealings with money are rather aimless. (C, D, E)
         */
        var verified = answers,
            mapping = [
                { key: 'q4s1',  value: { '1': ['C'], '0': ['A', 'B', 'D', 'E'] } },
                { key: 'q4s2',  value: { '1': ['A', 'D', 'E'], '0': ['B', 'C'] } },
                { key: 'q4s3',  value: { '1': ['A', 'D', 'E'], '0': ['B', 'C'] } },
                { key: 'q4s4',  value: { '1': ['D', 'E'], '0': ['A', 'B', 'C'] } },
                { key: 'q4s5',  value: { '1': ['B', 'C'], '0': ['A', 'D', 'E'] } },
                { key: 'q4s6',  value: { '1': ['E'], '0': ['A', 'B', 'C', 'D'] } },
                { key: 'q4s7',  value: { '1': ['C', 'E'], '0': ['A', 'B', 'D'] } },
                { key: 'q4s8',  value: { '1': ['A', 'B', 'D'], '0': ['C', 'E'] } },
                { key: 'q4s9',  value: { '1': ['D', 'E'], '0': ['A', 'B', 'C'] } },
                { key: 'q4s10', value: { '1': ['C', 'D', 'E'], '0': ['A', 'B'] } }
            ],
            stackable;
        for (var i = mapping.length - 1; i >= 0 && verified; i -= 1) {
            var key = mapping[i].key,
                value = mapping[i].value;
            if (verified = verified && answers[key] && value[answers[key]]) {
                stackable = value[answers[key]];
                for (var count in stackable) {
                    stack[stackable[count]] += 1;
                }
            }
        }
        return !!verified;
    },
    'q5': function calculateQ5 (stack, answers) {
        /*
            1. Put the €5,000 in your current account and paly it safe. (D)
            2. Divide the €5,000 into two parcels and invest both, €2,500 into blue chips and €2,500 into a startup-fund which could earn you some real money within the next couple of years. (B)
            3. You need €3,000 to pay for a weekend trip to Paris as a treat for your partner’s birthday. The rest (€2,000) will go into your current account. (C)
            4. Put €4,000 into your current account and invest the rest (€1,000) in an ETF (Exchange Traded Fund) (A)
            5. You put €3,000 into your current account to sort things out. The rest goes into the money box you labeled "car repairs". (E)
         */
        var verified = answers,
            mapping = [
                {key: 'q5', value: {'1': 'D', '2': 'B', '3': 'C', '4': 'A', '5': 'E'} }
            ];
        for (var i = mapping.length - 1; i >= 0 && verified; i -= 1) {
            var key = mapping[i].key,
                value = mapping[i].value;
            if (verified = verified && answers[key] && value[answers[key]]) {
                stack[value[answers[key]]] += 1;
            }
        }
        return !!verified;
    },
    'q6': function calculateQ6 (stack, answers) {
        /*
            1.  I would never ask a stranger to dance with me, even if I find them attractive.
                True (E)        False (A, B, C, D)
            2.  I never use a helmet whilst skiing or cycling.
                True (B, C)     False (A, D, E)
            3.  I don’t have a problem with exposing my data on the Internet.
                True (B, C)     False (D, E)
            4.  I enjoy exotic food and love ordering dishes that surprise me.
                True (B, C)     False (D, E)
            5.  I would never give up my full time job for a temporary post, even if I could earn much more money.
                True (D, E)     False  (A, B)
            6.  In a restaurant, I only ever order dishes that I know.
                True (D, E)     False (A, B, C)
            7.  For an exciting holiday I would even consider travelling to a country that carries a travel warning.
                True (A, B, C)  False (D, E)
            8.  I mostly start my holidays without booking anything or making an itinerary.
                True (B, C)     False (D, E)
            9.  At sport, I always enjoy pushing myself to the limits.
                True (A)        False (E)
            10. When grocery shopping, I try very hard to find the product with the longest expiry date.
                True (E)        False (A, B, C, D)
         */
        var verified = answers,
            mapping = [
                { key: 'q6s1',  value: { '1': ['E'], '0': ['A', 'B', 'C', 'D'] } },
                { key: 'q6s2',  value: { '1': ['B', 'C'], '0': ['A', 'D', 'E'] } },
                { key: 'q6s3',  value: { '1': ['B', 'C'], '0': ['D', 'E'] } },
                { key: 'q6s4',  value: { '1': ['B', 'C'], '0': ['D', 'E'] } },
                { key: 'q6s5',  value: { '1': ['D', 'E'], '0': ['A', 'B'] } },
                { key: 'q6s6',  value: { '1': ['D', 'E'], '0': ['A', 'B', 'C'] } },
                { key: 'q6s7',  value: { '1': ['A', 'B', 'C'], '0': ['D', 'E'] } },
                { key: 'q6s8',  value: { '1': ['B', 'C'], '0': ['D', 'E'] } },
                { key: 'q6s9',  value: { '1': ['A'], '0': ['E'] } },
                { key: 'q6s10', value: { '1': ['E'], '0': ['A', 'B', 'C', 'D'] } }
            ],
            stackable;
        for (var i = mapping.length - 1; i >= 0 && verified; i -= 1) {
            var key = mapping[i].key,
                value = mapping[i].value;
            if (verified = verified && answers[key] && value[answers[key]]) {
                stackable = value[answers[key]];
                for (var count in stackable) {
                    stack[stackable[count]] += 1;
                }
            }
        }
        return !!verified;
    },
    'q7': function calculateQ7 (stack, answers) {
        /*
            List I: (E)
            List II: (B)
            List III: (A)
            List IV: (C)
            List V: (D)
         */
        var verified = answers,
            mapping = [
                {key: 'q7', value: {'1': 'E', '2': 'B', '3': 'A', '4': 'C', '5': 'D'} }
            ];
        for (var i = mapping.length - 1; i >= 0 && verified; i -= 1) {
            var key = mapping[i].key,
                value = mapping[i].value;
            if (verified = verified && answers[key] && value[answers[key]]) {
                stack[value[answers[key]]] += 1;
            }
        }
        return !!verified;
    },
    'q8': function calculateQ8 (stack, answers) {
        /*
            Type A:
                + Biggest chunk: real estate investment
                + 2nd biggest chunk: stocks
                + 3rd biggest chunk: savings account
                + 4th biggest chunk: building savings contract
                + Smallest chunk: saving your money at home
            Type B:
                + Biggest chunk: stocks
                + 2nd biggest chunk: real estate investment
                + 3rd biggest chunk: savings account
                + 4th biggest chunk: building savings contract
                + Smallest chunk: saving your money at home
            Type C:
                + Biggest chunk: stocks
                + 2nd biggest chunk: building savings contract
                + 3rd biggest chunk: real estate investment
                + 4th biggest chunk: saving your money at home
                + 5th biggest chunk: savings account
            Type D:
                + Biggest chunk: savings account
                + 2nd biggest chunk: building savings contract
                + 3rd biggest chunk: saving your money at home
                + 4th biggest chunk: real estate investment
                + Smallest chunk: stocks
            Type E:
                + Biggest chunk: saving your money at home
                + 2nd biggest chunk: real estate investment
                + 3rd biggest chunk: savings account
                + 4th biggest chunk: building savings contract
                + Smallest chunk: stocks
         */
        var verified = answers,
            mapping = [
                {key: 'q8', value: {'1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E'} }
            ];
        for (var i = mapping.length - 1; i >= 0 && verified; i -= 1) {
            var key = mapping[i].key,
                value = mapping[i].value;
            if (verified = verified && answers[key] && value[answers[key]]) {
                stack[value[answers[key]]] += 1;
            }
        }
        return !!verified;
    }
};

module.exports = {

    /**
     * store answers in session
     * @param {Object} req: request with body and session data
     * @param {Object} callback
     */
    store: function (req, callback) {
        var question = req.body.q;
        req.session['q' + question] = req.body;
        callback && callback();
    },

    /**
     * erase answers from session
     * @param {Object} req: request with session data
     * @param {Object} callback
     */
    reset: function (req, callback) {
        for (var question = 0; question <= 8; question += 1) {
            delete req.session['q' + question];
        }
        callback && callback();
    },

    /**
     * update the result if all answers are present
     * @param {Object} req: request with session data
     * @param {Object} callback
     */
    update: function (req, callback) {
        var result = req.session['result'].calculation,
            winner = this.determine(req.session);
        if (winner.length === 1) {
            result = winner[0];
        } else if (winner.length === 0) {
            // less scientific fallback (we do not want to resort to going to /error)
            result = result || Object.keys(legend)[Math.floor(Math.random() * 5)];
        } else {
            result = winner[Math.floor(Math.random() * winner.length)];
        }
        req.session['result'].calculation = result;
        req.session['result'].index = legend[result].index;
        req.session['result'].persona = legend[result].persona;
        callback && callback();
    },

    /**
     * determine the winner for a given set of answers
     * @param {Object} answers: answers for all questions ('q1' - 'q8')
     * @return {Array} with zero winners (error!), one winner (wohoo!) or more than one winner (a tie!)
     */
    determine: function (answers) {
        var winner = [],
            stack = {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0},
            keepGoing = true,
            types = Object.keys(stack),
            type,
            highest = 0;
        try {
            for (var i = 1; i <= 8 && keepGoing; i += 1) {
                var question = 'q' + i;
                keepGoing = keepGoing && calculate[question](stack, answers[question]);

            }
        } catch (e) {
            console.error(e);
            keepGoing = false;
        }
        if (keepGoing) {
            for (type in types) {
                highest = Math.max(stack[types[type]], highest);
            }
            for (type in types) {
                if (stack[types[type]] === highest) {
                    winner.push(types[type]);
                }
            }
        }
        return winner;
    }

};