/**
 * Procedural Math Question Generator
 * Generates endless unique problems with realistic distractors and step-by-step LaTeX solutions.
 */

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

export const MathGenerators = {
  // БЛОК 1: ФОРМУЛЫ СОКРАЩЕННОГО УМНОЖЕНИЯ
  fsu: () => {
    const types = ['square_sum', 'square_diff', 'diff_of_squares'];
    const type = randomChoice(types);

    if (type === 'square_sum') {
      const a = randomChoice([1, 2, 3]);
      const b = randomInt(2, 9);
      const aStr = a === 1 ? 'x' : `${a}x`;
      const a2 = a * a;
      const a2Str = a2 === 1 ? 'x^2' : `${a2}x^2`;
      const mid = 2 * a * b;
      const b2 = b * b;

      const question = `Раскройте скобки: $(${aStr} + ${b})^2$`;
      const correct = `$${a2Str} + ${mid}x + ${b2}$`;
      const distractors = [
        `$${a2Str} + ${b2}$`, // забыли удвоенное
        `$${a2Str} + ${a * b}x + ${b2}$`, // не умножили на 2
        `$${a2Str} + ${mid}x + ${2 * b}$` // умножили b на 2 вместо квадрата
      ];

      return {
        id: `gen_fsu_${Date.now()}_${Math.random()}`,
        latex_text: question,
        options: shuffle([correct, ...distractors]),
        correct_answer: correct,
        explanation_latex: `Формула квадрата суммы: $(a + b)^2 = a^2 + 2ab + b^2$. \\\\ В нашем случае: $(${aStr})^2 + 2 \\cdot (${aStr}) \\cdot ${b} + ${b}^2 = ${a2Str} + ${mid}x + ${b2}$.`
      };
    }

    if (type === 'square_diff') {
      const a = randomChoice([1, 2, 3]);
      const b = randomInt(2, 9);
      const aStr = a === 1 ? 'x' : `${a}x`;
      const a2 = a * a;
      const a2Str = a2 === 1 ? 'x^2' : `${a2}x^2`;
      const mid = 2 * a * b;
      const b2 = b * b;

      const question = `Раскройте скобки: $(${aStr} - ${b})^2$`;
      const correct = `$${a2Str} - ${mid}x + ${b2}$`;
      const distractors = [
        `$${a2Str} - ${b2}$`,
        `$${a2Str} - ${mid}x - ${b2}$`, // ошибка в знаке последнего слагаемого
        `$${a2Str} + ${mid}x + ${b2}$`
      ];

      return {
        id: `gen_fsu_${Date.now()}_${Math.random()}`,
        latex_text: question,
        options: shuffle([correct, ...distractors]),
        correct_answer: correct,
        explanation_latex: `Квадрат разности: $(a - b)^2 = a^2 - 2ab + b^2$. \\\\ В итоге: $(${aStr})^2 - 2 \\cdot (${aStr}) \\cdot ${b} + ${b}^2 = ${a2Str} - ${mid}x + ${b2}$.`
      };
    }

    // diff_of_squares: x^2 - b^2
    const b = randomInt(3, 12);
    const b2 = b * b;
    const question = `Разложите на множители: $x^2 - ${b2}$`;
    const correct = `$(x - ${b})(x + ${b})$`;
    const distractors = [
      `$(x - ${b})^2$`,
      `$(x + ${b})^2$`,
      `$(x - ${b2})(x + 1)$`
    ];

    return {
      id: `gen_fsu_${Date.now()}_${Math.random()}`,
      latex_text: question,
      options: shuffle([correct, ...distractors]),
      correct_answer: correct,
      explanation_latex: `Разность квадратов: $a^2 - b^2 = (a - b)(a + b)$. Так как $${b2} = ${b}^2$, получаем $(x - ${b})(x + ${b})$.`
    };
  },

  // БЛОК 2: ДИСКРИМИНАНТ И КВАДРАТНЫЕ УРАВНЕНИЯ
  'quadratic-equations': () => {
    const types = ['roots', 'discriminant'];
    const type = randomChoice(types);

    // Генерация от красивых целых корней
    const x1 = randomInt(-6, 6);
    let x2 = randomInt(-6, 6);
    if (x1 === x2) x2 += 1;

    const b = -(x1 + x2);
    const c = x1 * x2;
    const bSign = b >= 0 ? `+ ${b === 1 ? '' : b}x` : `- ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`;
    const cSign = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
    const eq = `x^2 ${b !== 0 ? bSign : ''} ${cSign} = 0`;
    const D = b * b - 4 * c;

    if (type === 'discriminant') {
      const question = `Найдите дискриминант ($D$) уравнения: $${eq}$`;
      const correct = `${D}`;
      const distractors = [
        `${b * b + 4 * c}`, // забыли минус в -4ac
        `${b * b - 2 * c}`,
        `${Math.abs(D) + 4}`
      ].filter(v => v !== correct).slice(0, 3);

      return {
        id: `gen_quad_${Date.now()}_${Math.random()}`,
        latex_text: question,
        options: shuffle([correct, ...distractors]),
        correct_answer: correct,
        explanation_latex: `Формула дискриминанта: $D = b^2 - 4ac$. \\\\ Здесь $a=1, b=${b}, c=${c}$. \\\\ $D = (${b})^2 - 4 \\cdot 1 \\cdot (${c}) = ${b * b} - (${4 * c}) = ${D}$.`
      };
    }

    // Поиск корней
    const sortedRoots = [x1, x2].sort((m, n) => m - n);
    const correct = `${sortedRoots[0]}; ${sortedRoots[1]}`;
    const distractors = [
      `${-sortedRoots[0]}; ${-sortedRoots[1]}`, // перепутали знаки
      `${sortedRoots[0] + 1}; ${sortedRoots[1] - 1}`,
      `${sortedRoots[0]}; ${-sortedRoots[1]}`
    ].filter(v => v !== correct).slice(0, 3);

    return {
      id: `gen_quad_${Date.now()}_${Math.random()}`,
      latex_text: `Найдите корни уравнения: $${eq}$`,
      options: shuffle([correct, ...distractors]),
      correct_answer: correct,
      explanation_latex: `По теореме Виета: $x_1 + x_2 = -b = ${-b}$, а $x_1 \\cdot x_2 = c = ${c}$. Корни: $x_1 = ${x1}$, $x_2 = ${x2}$.`
    };
  },

  // БЛОК 3: СВОЙСТВА СТЕПЕНЕЙ И КОРНЕЙ
  'powers-and-roots': () => {
    const types = ['mult_pow', 'div_pow', 'pow_of_pow', 'negative_pow'];
    const type = randomChoice(types);

    if (type === 'mult_pow') {
      const n = randomInt(2, 7);
      const m = randomInt(2, 8);
      const question = `Упростите выражение: $a^{${n}} \\cdot a^{${m}}$`;
      const correct = `$a^{${n + m}}$`;
      const distractors = [`$a^{${n * m}}$`, `$a^{${Math.abs(n - m)}}$`, `$2a^{${n + m}}$`];
      return {
        id: `gen_pow_${Date.now()}_${Math.random()}`,
        latex_text: question,
        options: shuffle([correct, ...distractors]),
        correct_answer: correct,
        explanation_latex: `При умножении степеней с одинаковым основанием показатели складываются: $a^n \\cdot a^m = a^{n+m}$. \\\\ $a^{${n}} \\cdot a^{${m}} = a^{${n} + ${m}} = a^{${n + m}}$.`
      };
    }

    if (type === 'pow_of_pow') {
      const n = randomInt(2, 5);
      const m = randomInt(2, 4);
      const question = `Упростите выражение: $(x^{${n}})^{${m}}$`;
      const correct = `$x^{${n * m}}$`;
      const distractors = [`$x^{${n + m}}$`, `$x^{${Math.pow(n, m)}}$`, `$x^{${n}}$`];
      return {
        id: `gen_pow_${Date.now()}_${Math.random()}`,
        latex_text: question,
        options: shuffle([correct, ...distractors]),
        correct_answer: correct,
        explanation_latex: `При возведении степени в степень показатели перемножаются: $(x^n)^m = x^{n \\cdot m}$. \\\\ $(x^{${n}})^{${m}} = x^{${n} \\cdot ${m}} = x^{${n * m}}$.`
      };
    }

    // negative_pow: a^-2
    const base = randomChoice([2, 3, 4, 5]);
    const exp = randomChoice([2, 3]);
    const val = Math.pow(base, exp);
    const question = `Вычислите значение: $${base}^{-${exp}}$`;
    const correct = `$\\frac{1}{${val}}$`;
    const distractors = [`$-${val}$`, `$\\frac{1}{${base * exp}}$`, `${val}`];
    return {
      id: `gen_pow_${Date.now()}_${Math.random()}`,
      latex_text: question,
      options: shuffle([correct, ...distractors]),
      correct_answer: correct,
      explanation_latex: `Число в отрицательной степени: $a^{-n} = \\frac{1}{a^n}$. \\\\ $${base}^{-${exp}} = \\frac{1}{${base}^{${exp}}} = \\frac{1}{${val}}$.`
    };
  },

  // БЛОК 4: ЛИНЕЙНЫЕ УРАВНЕНИЯ И НЕРАВЕНСТВА
  'linear-equations-and-inequalities': () => {
    const types = ['linear_eq', 'linear_ineq'];
    const type = randomChoice(types);

    const x = randomInt(-9, 9);
    const a = randomChoice([2, 3, 4, 5, 6, -2, -3]);
    const b = randomInt(-15, 15);
    const c = a * x + b;
    const bStr = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;

    if (type === 'linear_eq') {
      const question = `Решите уравнение: $${a}x ${bStr} = ${c}$`;
      const correct = `${x}`;
      const distractors = [`${x + 1}`, `${-x}`, `${x - 2}`].filter(v => v !== correct).slice(0, 3);

      return {
        id: `gen_lin_${Date.now()}_${Math.random()}`,
        latex_text: question,
        options: shuffle([correct, ...distractors]),
        correct_answer: correct,
        explanation_latex: `Перенесём слагаемые: $${a}x = ${c} - (${b}) \\implies ${a}x = ${c - b} \\implies x = \\frac{${c - b}}{${a}} = ${x}$.`
      };
    }

    // Неравенство: ax + b > c
    const sign = a > 0 ? '>' : '<';
    const question = `Решите неравенство: $${a}x ${bStr} > ${c}$`;
    const correct = `$x ${sign} ${x}$`;
    const oppSign = sign === '>' ? '<' : '>';
    const distractors = [
      `$x ${oppSign} ${x}$`,
      `$x ${sign} ${-x}$`,
      `$x ${oppSign} ${-x}$`
    ];

    return {
      id: `gen_lin_${Date.now()}_${Math.random()}`,
      latex_text: question,
      options: shuffle([correct, ...distractors]),
      correct_answer: correct,
      explanation_latex: `$${a}x > ${c - b}$. Так как мы делим на $${a}$ ${a < 0 ? '(отрицательное число, знак меняется на противоположный)' : ''}, получаем $x ${sign} ${x}$.`
    };
  },

  /**
   * Сгенерировать пачку из N задач по slug темы
   */
  generateBatch: (topicSlug, count = 10) => {
    const generator = MathGenerators[topicSlug] || MathGenerators['fsu'];
    const questions = [];
    for (let i = 0; i < count; i++) {
      questions.push(generator());
    }
    return questions;
  }
};
