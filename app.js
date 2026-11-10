"use strict";

/* ============================================================
   东东账本 v8
   纯前端记账应用：记一笔 / 智能导入 / 区间统计 / 明细管理
   ============================================================ */

const APP_VERSION = "10.0.0";
const STORAGE_KEY = "dongdong-ledger.records";
const LEGACY_STORAGE_KEY = "xiaoman-ledger.records";
const WELCOME_KEY = "dongdong-ledger.welcomed";
const MAX_AMOUNT_CENTS = 9999999999;
const MAX_REPORT_DAYS = 366;
const CATEGORY_RULES_KEY = "dongdong-ledger.category-rules";
const OCR_ALIASES_KEY = "dongdong-ledger.ocr-aliases";

const EXPENSE_CATEGORIES = [
  { name: "饮食", icon: "food", color: "#B85C42", soft: "#F8E7DE", type: "expense" },
  { name: "购物", icon: "shopping", color: "#A4743F", soft: "#F6EADB", type: "expense" },
  { name: "交通", icon: "transport", color: "#517B8A", soft: "#E5F0F2", type: "expense" },
  { name: "游戏", icon: "game", color: "#6B5A9E", soft: "#ECE8F7", type: "expense" },
  { name: "娱乐", icon: "fun", color: "#A65D7E", soft: "#F7E7EE", type: "expense" },
  { name: "居住", icon: "home", color: "#687C46", soft: "#ECF0E2", type: "expense" },
  { name: "医疗", icon: "health", color: "#B04A4A", soft: "#F8E5E3", type: "expense" },
  { name: "学习", icon: "study", color: "#416D9E", soft: "#E5EDF6", type: "expense" },
  { name: "人情", icon: "gift", color: "#966B4F", soft: "#F4EAE2", type: "expense" },
  { name: "其他", icon: "other", color: "#6E7A73", soft: "#ECEFEB", type: "expense" }
];
const INCOME_CATEGORIES = [
  { name: "工资", icon: "salary", color: "#3F7A5D", soft: "#E4F0E8", type: "income" },
  { name: "奖金", icon: "award", color: "#B07D3C", soft: "#F7EEDD", type: "income" },
  { name: "兼职", icon: "briefcase", color: "#4E7291", soft: "#E8EFF5", type: "income" },
  { name: "理财", icon: "trending", color: "#6E6A9E", soft: "#EEECF7", type: "income" },
  { name: "红包", icon: "envelope", color: "#B85555", soft: "#F8E6E4", type: "income" },
  { name: "退款", icon: "refund", color: "#5E7D7A", soft: "#E7F0EE", type: "income" },
  { name: "其他收入", icon: "other", color: "#7A7468", soft: "#EFECE5", type: "income" }
];
const CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
const EXPENSE_CATEGORY_NAMES = EXPENSE_CATEGORIES.map((item) => item.name);
const INCOME_CATEGORY_NAMES = INCOME_CATEGORIES.map((item) => item.name);
const CATEGORY_NAMES = CATEGORIES.map((item) => item.name);
const CATEGORY_MAP = new Map(CATEGORIES.map((item) => [item.name, item]));
const CATEGORY_TYPE = new Map(CATEGORIES.map((item) => [item.name, item.type]));
const CATEGORY_PATTERN = [...CATEGORY_NAMES].sort((a, b) => b.length - a.length).join("|");

function categoriesForType(type) {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

function categoryType(name) {
  return CATEGORY_TYPE.get(name) || "expense";
}

function defaultCategoryForType(type) {
  return categoriesForType(type)[0].name;
}

const CATEGORY_ALIASES = {
  "餐饮": "饮食",
  "吃饭": "饮食",
  "吃喝": "饮食",
  "外卖": "饮食",
  "食品": "饮食",
  "美食": "饮食",
  "购物消费": "购物",
  "买东西": "购物",
  "出行": "交通",
  "车费": "交通",
  "网游": "游戏",
  "游戏充值": "游戏",
  "休闲": "娱乐",
  "娱乐休闲": "娱乐",
  "房租": "居住",
  "住房": "居住",
  "居家": "居住",
  "医药": "医疗",
  "健康": "医疗",
  "教育": "学习",
  "书籍": "学习",
  "礼物": "人情",
  "社交": "人情",
  "杂项": "其他",
  "其它": "其他",
  "薪水": "工资",
  "薪资": "工资",
  "月薪": "工资",
  "发工资": "工资",
  "年终奖": "奖金",
  "绩效": "奖金",
  "提成": "奖金",
  "副业": "兼职",
  "外快": "兼职",
  "稿费": "兼职",
  "基金": "理财",
  "股票": "理财",
  "利息": "理财",
  "分红": "理财",
  "收益": "理财",
  "压岁钱": "红包",
  "礼金": "红包",
  "报销": "退款",
  "返现": "退款",
  "退货": "退款",
  "退税": "退款",
  "补贴": "退款",
  "进账": "其他收入",
  "到账": "其他收入",
  "收款": "其他收入",
  "转入": "其他收入",
  "收入": "其他收入"
};

const CATEGORY_KEYWORDS = {
  "饮食": ["早餐", "早饭", "午餐", "午饭", "中饭", "晚饭", "晚餐", "夜宵", "外卖", "奶茶", "咖啡", "饮料", "矿泉水", "买水", "水", "水果", "零食", "餐饮", "吃饭", "食堂", "火锅", "烧烤", "米线", "面条", "面包", "蛋糕", "甜品", "汉堡", "披萨", "寿司", "麻辣烫", "小吃", "买菜", "菜", "肉", "鱼", "酒", "可乐", "雪碧", "牛奶", "酸奶", "冰淇淋", "餐"],
  "购物": ["淘宝", "天猫", "京东", "拼多多", "网购", "衣服", "衣", "裤", "鞋", "帽", "包", "化妆品", "护肤", "洗面奶", "日用品", "纸巾", "洗衣液", "超市", "快递", "家居", "耳机", "充电器", "数码", "手机", "电脑", "键盘", "鼠标", "眼镜", "首饰"],
  "交通": ["打车", "滴滴", "出租车", "地铁", "公交", "高铁", "火车", "机票", "飞机", "油费", "加油", "停车", "共享单车", "单车", "车费", "路费", "过路费", "船票", "交通"],
  "游戏": ["游戏", "游戏充值", "三角洲行动", "三角洲", "王者荣耀", "王者", "和平精英", "英雄联盟", "原神", "崩坏", "星穹铁道", "绝区零", "鸣潮", "明日方舟", "暗区突围", "使命召唤", "无畏契约", "瓦罗兰特", "永劫无间", "蛋仔派对", "蛋仔", "元梦之星", "第五人格", "火影忍者", "穿越火线", "地下城与勇士", "逆水寒", "天涯明月刀", "剑网3", "梦幻西游", "大话西游", "率土之滨", "三国志战略版", "金铲铲", "云顶之弈", "英雄联盟手游", "黑神话", "艾尔登法环", "双人成行", "我的世界", "香肠派对", "光遇", "阴阳师", "战双", "重返未来", "白荆回廊", "晶核", "米哈游", "腾讯游戏", "网易游戏", "steam", "epic", "playstation", "ps5", "xbox", "switch", "任天堂", "点券", "游戏皮肤", "皮肤", "抽卡", "月卡", "战令", "通行证", "代练", "陪玩", "点卡", "q币", "游戏币", "开黑", "氪金", "valorant", "lol"],
  "娱乐": ["电影", "看电影", "唱歌", "ktv", "演出", "演唱会", "剧本杀", "密室", "桌游", "门票", "会员", "视频会员", "音乐", "酒吧", "旅游", "景区", "健身", "运动", "游泳", "展览", "博物馆", "娱乐", "游戏厅", "台球"],
  "居住": ["房租", "租房", "水费", "电费", "燃气", "煤气", "物业", "宽带", "网费", "话费", "通讯", "家具", "家电", "维修", "保洁", "搬家", "房贷"],
  "医疗": ["医院", "看病", "挂号", "药", "体检", "牙医", "诊所", "医疗", "口罩", "疫苗", "医保", "按摩", "理疗"],
  "学习": ["书", "书籍", "课程", "学费", "培训", "文具", "考试", "报名费", "网课", "书店", "打印", "学习", "资料", "kindle"],
  "人情": ["红包", "礼物", "送礼", "请客", "份子钱", "随礼", "生日", "结婚", "转账", "孝敬", "给爸妈", "朋友"],
  "其他": []
};

const INCOME_KEYWORDS = {
  "工资": ["工资", "薪水", "薪资", "月薪", "发薪", "薪酬"],
  "奖金": ["奖金", "年终奖", "绩效", "提成", "奖励", "分红奖"],
  "兼职": ["兼职", "外快", "副业", "稿费", "接单", "劳务", "主持"],
  "理财": ["理财", "利息", "分红", "基金", "股票", "收益", "存款利息", "国债", "黄金"],
  "红包": ["红包", "压岁钱", "礼金", "收礼"],
  "退款": ["退款", "退货", "报销", "返现", "返还", "补贴", "退税"],
  "其他收入": ["收入", "进账", "到账", "收款", "转入", "卖二手", "闲置出售"]
};

/* ---------- Small helpers ---------- */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function pad2(value) {
  return String(value).padStart(2, "0");
}

function uid() {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function escapeHTML(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function normalizeName(value) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
}

function iconMarkup(name, className = "icon") {
  return `<svg class="${className}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

function categoryStyle(category) {
  const item = CATEGORY_MAP.get(category) || CATEGORY_MAP.get("其他");
  return `--cat:${item.color};--cat-soft:${item.soft};`;
}

/* ---------- Dates (all local, China calendar) ---------- */
function dateToISO(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function todayISO(date = new Date()) {
  return dateToISO(date);
}

function parseISO(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) {
    return null;
  }
  return date;
}

function isValidISO(iso) {
  return Boolean(parseISO(iso));
}

function addDaysISO(iso, days) {
  const date = parseISO(iso);
  if (!date) return iso;
  date.setDate(date.getDate() + days);
  return dateToISO(date);
}

function daysBetween(startISO, endISO) {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  if (!start || !end) return 0;
  const startUTC = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUTC - startUTC) / 86400000);
}

function weekdayName(iso) {
  const date = parseISO(iso);
  if (!date) return "";
  return `星期${"日一二三四五六"[date.getDay()]}`;
}

function weekdayShort(iso) {
  const date = parseISO(iso);
  if (!date) return "";
  return `周${"日一二三四五六"[date.getDay()]}`;
}

function formatCnDate(iso, includeYear = true) {
  const date = parseISO(iso);
  if (!date) return "";
  return includeYear
    ? `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    : `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatMonthDay(iso) {
  const date = parseISO(iso);
  if (!date) return "";
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatNumericDate(iso) {
  const date = parseISO(iso);
  if (!date) return "";
  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`;
}

function formatShortNumeric(iso) {
  const date = parseISO(iso);
  if (!date) return "";
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function isToday(iso) {
  return iso === todayISO();
}

function relativeDayLabel(iso) {
  const today = todayISO();
  if (iso === today) return "今天";
  if (iso === addDaysISO(today, -1)) return "昨天";
  return weekdayShort(iso);
}

/* ---------- Money ---------- */
const moneyFormatter = new Intl.NumberFormat("zh-CN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function formatMoney(cents) {
  const value = Number(cents);
  if (!Number.isFinite(value)) return "¥0.00";
  return `¥${moneyFormatter.format(value / 100)}`;
}

function formatMoneyNumber(cents) {
  const value = Number(cents);
  if (!Number.isFinite(value)) return "0.00";
  return moneyFormatter.format(value / 100);
}

function formatSignedMoney(cents) {
  const value = Number(cents);
  if (!Number.isFinite(value) || value === 0) return "¥0.00";
  if (value > 0) return `+${formatMoney(value)}`;
  return `−${formatMoney(Math.abs(value))}`;
}

function sumByType(records) {
  const totals = { expense: 0, income: 0, net: 0 };
  records.forEach((record) => {
    const cents = Math.round(Number(record.amount) * 100);
    if (record.type === "income") totals.income += cents;
    else totals.expense += cents;
  });
  totals.net = totals.income - totals.expense;
  return totals;
}

function centsFromAmount(value) {
  let text = String(value == null ? "" : value)
    .replace(/[￥¥元块钱,\s]/g, "")
    .replace(/^[+＋]/, "")
    .replace(/[−–—－]/g, "-");
  if (!text || text === "." || text === "-") return null;
  if (!/^-?\d+(?:\.\d{0,2})?$/.test(text)) return null;
  const number = Number(text);
  if (!Number.isFinite(number) || number === 0) return null;
  const cents = Math.round(Math.abs(number) * 100);
  if (cents < 1 || cents > MAX_AMOUNT_CENTS) return null;
  return cents;
}

function amountFromCents(cents) {
  return (Number(cents) / 100).toFixed(2);
}

function sanitizeAmountInput(value) {
  let text = String(value || "").replace(/[^\d.]/g, "");
  const dotIndex = text.indexOf(".");
  if (dotIndex !== -1) {
    text = `${text.slice(0, dotIndex + 1)}${text.slice(dotIndex + 1).replace(/\./g, "").slice(0, 2)}`;
  }
  if (text.startsWith(".")) text = `0${text}`;
  if (text.length > 1 && text.startsWith("0") && text[1] !== ".") {
    text = text.replace(/^0+/, "") || "0";
  }
  return text.slice(0, 12);
}

/* ---------- Category engine ---------- */
function classifyByKeywords(text, categories, keywordMap, fallback) {
  const value = normalizeName(text).toLowerCase();
  if (!value) return fallback;
  let best = fallback;
  let bestScore = 0;
  for (const category of categories) {
    const keywords = keywordMap[category.name] || [];
    let score = 0;
    for (const keyword of keywords) {
      if (keyword && value.includes(keyword.toLowerCase())) {
        score += keyword.length * 2 + (keyword.length > 1 ? 1 : 0);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = category.name;
    }
  }
  return bestScore > 0 ? best : fallback;
}

function classifyExpense(text) {
  return classifyByKeywords(text, EXPENSE_CATEGORIES, CATEGORY_KEYWORDS, "其他");
}

function classifyIncome(text) {
  return classifyByKeywords(text, INCOME_CATEGORIES, INCOME_KEYWORDS, "其他收入");
}

function classifyTransaction(text, type = "expense") {
  const learned = learnedCategoryFor(text, type);
  if (learned) return learned;
  return type === "income" ? classifyIncome(text) : classifyExpense(text);
}

function normalizeCategory(value, type = "") {
  const text = normalizeName(value);
  if (!text) return "";
  const allowed = type ? categoriesForType(type) : CATEGORIES;
  const allowedNames = new Set(allowed.map((category) => category.name));
  if (allowedNames.has(text)) return text;
  for (const [alias, category] of Object.entries(CATEGORY_ALIASES)) {
    if (allowedNames.has(category) && text.includes(alias)) return category;
  }
  for (const category of allowed) {
    if (text.includes(category.name)) return category.name;
  }
  return "";
}

function findExplicitCategory(line) {
  const labelMatch = line.match(/(?:分类|类别)\s*[：:]\s*([^\s,，;；|]+)/);
  if (labelMatch) {
    const category = normalizeCategory(labelMatch[1]);
    if (category) return category;
  }
  const tagMatch = line.match(new RegExp(`#(${CATEGORY_PATTERN})`));
  if (tagMatch) return tagMatch[1];
  const bracketMatch = line.match(new RegExp(`[\\[【（(]\\s*(${CATEGORY_PATTERN})\\s*[\\]】）)]`));
  if (bracketMatch) return bracketMatch[1];
  return "";
}

function detectTransactionType(text, amountInfo = null, categoryHint = "") {
  if (amountInfo && amountInfo.sign === "+") return "income";
  if (amountInfo && amountInfo.sign === "-") return "expense";
  if (categoryHint && CATEGORY_MAP.has(categoryHint)) return categoryType(categoryHint);
  const value = normalizeName(text);
  const incomePattern = /(?:收入|工资|薪水|薪资|月薪|奖金|年终奖|绩效|提成|兼职|外快|副业|稿费|理财|利息|分红|收益|基金|股票|退款|报销|返现|退货|补贴|退税|进账|到账|收款|转入|压岁钱|礼金|(?:收|收到|收了)红包|红包收入|卖二手|闲置出售|卖出|转卖|卖了)/;
  const expensePattern = /(?:支出|消费|花了|花费|付款|付了|实付|支付|买了|购买|请客|送礼)/;
  if (incomePattern.test(value)) return "income";
  if (expensePattern.test(value)) return "expense";
  return "expense";
}
/* ---------- Natural language parser ---------- */
function isValidYMD(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isoFromYMD(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function extendWeekday(text, end) {
  const tail = text.slice(end);
  const match = tail.match(/^\s*[（(]?\s*(?:周|星期)[一二三四五六日天]\s*[)）]?/);
  return match ? end + match[0].length : end;
}

function extractDate(text, baseDate = new Date()) {
  const source = String(text || "");
  const currentYear = baseDate.getFullYear();

  const fullPattern = /(\d{4})\s*(?:年|[\/.-])\s*(\d{1,2})\s*(?:月|[\/.-])\s*(\d{1,2})\s*[日号]?/;
  const fullMatch = fullPattern.exec(source);
  if (fullMatch) {
    const year = Number(fullMatch[1]);
    const month = Number(fullMatch[2]);
    const day = Number(fullMatch[3]);
    if (isValidYMD(year, month, day)) {
      const end = extendWeekday(source, fullMatch.index + fullMatch[0].length);
      return {
        iso: isoFromYMD(year, month, day),
        start: fullMatch.index,
        end,
        raw: source.slice(fullMatch.index, end)
      };
    }
  }

  const relativePattern = /(今天|今日|昨天|昨日|前天)/;
  const relativeMatch = relativePattern.exec(source);
  if (relativeMatch) {
    const map = { "今天": 0, "今日": 0, "昨天": -1, "昨日": -1, "前天": -2 };
    const iso = addDaysISO(todayISO(baseDate), map[relativeMatch[1]]);
    const end = extendWeekday(source, relativeMatch.index + relativeMatch[0].length);
    return { iso, start: relativeMatch.index, end, raw: source.slice(relativeMatch.index, end) };
  }

  const cnPattern = /(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]?/;
  const cnMatch = cnPattern.exec(source);
  if (cnMatch) {
    const month = Number(cnMatch[1]);
    const day = Number(cnMatch[2]);
    if (isValidYMD(currentYear, month, day)) {
      const end = extendWeekday(source, cnMatch.index + cnMatch[0].length);
      return {
        iso: isoFromYMD(currentYear, month, day),
        start: cnMatch.index,
        end,
        raw: source.slice(cnMatch.index, end),
        inferredYear: true
      };
    }
  }

  const shortPattern = /(?<!\d)(\d{1,2})\s*[\/-]\s*(\d{1,2})(?!\d)/;
  const shortMatch = shortPattern.exec(source);
  if (shortMatch) {
    const month = Number(shortMatch[1]);
    const day = Number(shortMatch[2]);
    if (isValidYMD(currentYear, month, day)) {
      const end = extendWeekday(source, shortMatch.index + shortMatch[0].length);
      return {
        iso: isoFromYMD(currentYear, month, day),
        start: shortMatch.index,
        end,
        raw: source.slice(shortMatch.index, end),
        inferredYear: true
      };
    }
  }

  return null;
}

function extractAmount(text) {
  const source = String(text || "");
  const pattern = /([+\-−–—＋－]?)\s*[¥￥]?\s*(\d{1,9}(?:[.,]\d{1,2})?)\s*(元|块钱|块|rmb)?/gi;
  const candidates = [];
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const numericText = match[2].replace(",", ".");
    const value = Number(numericText);
    if (!Number.isFinite(value) || value <= 0) continue;
    const start = match.index;
    const end = pattern.lastIndex;
    const before = source.slice(Math.max(0, start - 10), start);
    const after = source.slice(end, end + 8);
    let score = 0;
    const sign = (match[1] === "+" || match[1] === "＋") ? "+" : /[-−–—－]/.test(match[1]) ? "-" : "";
    if (/[¥￥]/.test(match[0]) || match[3]) score += 6;
    if (sign) score += 5;
    if (/[：:]\s*$/.test(before)) score += 4;
    if (match[2].includes(".") || match[2].includes(",")) score += 1;
    if (/^\s*(?:个|杯|件|次|人|天|月|年|克|kg|斤|张|份|瓶|包|盒|公里|km|小时)/i.test(after)) score -= 5;
    if (value >= 1900 && value <= 2100 && !/[¥￥]/.test(match[0]) && !match[3]) score -= 4;
    score += (start / Math.max(1, source.length)) * 0.5;
    candidates.push({ value, start, end, raw: match[0], score, sign, negative: sign === "-", positive: sign === "+" });
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => (b.score - a.score) || (b.start - a.start));
  return candidates[0];
}

function cleanTransactionName(text) {
  const categoryTagPattern = new RegExp(`#(?:${CATEGORY_PATTERN})`, "g");
  const categoryBracketPattern = new RegExp(`[\\[【（(]\\s*(?:${CATEGORY_PATTERN})\\s*[\\]】）)]`, "g");
  return normalizeName(
    String(text || "")
      .replace(/[¥￥]/g, " ")
      .replace(/(?:金额|支出|收入|花费|花了|付款|付了|实付|支付|进账|到账|收款)\s*[：:]?/g, " ")
      .replace(/(?:分类|类别)\s*[：:]\s*[^\s,，;；|]+/g, " ")
      .replace(categoryTagPattern, " ")
      .replace(categoryBracketPattern, " ")
      .replace(/^[\s,，。;；:：|\-—–_+]+|[\s,，。;；:：|\-—–_+]+$/g, "")
  );
}

function parseTransactionLine(line, baseDate = new Date(), contextDate = "") {
  const rawLine = String(line || "").trim();
  if (!rawLine) return null;
  const explicitCategory = findExplicitCategory(rawLine);
  const dateInfo = extractDate(rawLine, baseDate);
  let rest = rawLine;
  if (dateInfo) {
    rest = `${rest.slice(0, dateInfo.start)} ${rest.slice(dateInfo.end)}`;
  }
  const amountInfo = extractAmount(rest);
  if (!amountInfo) return null;
  rest = `${rest.slice(0, amountInfo.start)} ${rest.slice(amountInfo.end)}`;
  let name = cleanTransactionName(rest);
  const type = detectTransactionType(rawLine, amountInfo, explicitCategory);
  if (!name) name = type === "income" ? "未命名收入" : "未命名支出";
  if (name.length > 40) name = name.slice(0, 40);
  const category = explicitCategory && categoryType(explicitCategory) === type
    ? explicitCategory
    : classifyTransaction(name, type);
  return {
    id: `imp_${uid()}`,
    date: dateInfo ? dateInfo.iso : (contextDate || todayISO(baseDate)),
    name,
    amount: Number((amountInfo.value).toFixed(2)),
    type,
    category,
    selected: true,
    dateGuessed: !dateInfo && !contextDate,
    sourceLine: rawLine
  };
}

function isHeaderRest(rest) {
  const withoutWeekday = String(rest || "").replace(/[（(]?\s*(?:周|星期)[一二三四五六日天]\s*[)）]?/g, " ");
  if (extractAmount(withoutWeekday)) return false;
  const cleaned = withoutWeekday.replace(/[\s,，。;；:：|\-—–_+]/g, "");
  return /^(?:日期|时间|收支|账单|明细|记录|收支明细|消费记录|收入|支出|收入明细|支出明细|账单明细|明细账单|微信账单|支付宝账单|日|号)?$/.test(cleaned);
}

function isDateHeaderLine(line, dateInfo) {
  if (!dateInfo) return false;
  const rest = `${line.slice(0, dateInfo.start)} ${line.slice(dateInfo.end)}`;
  return isHeaderRest(rest);
}

function extractDotDatePrefix(line, baseDate = new Date()) {
  const text = String(line || "").trim();
  const match = /^(\d{1,2})\.(\d{1,2})(?!\d)/.exec(text);
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  if (!isValidYMD(baseDate.getFullYear(), month, day)) return null;
  const rest = text.slice(match[0].length).trim();
  return { iso: isoFromYMD(baseDate.getFullYear(), month, day), rest };
}

function parseText(text, baseDate = new Date()) {
  const source = String(text || "").replace(/\r\n?/g, "\n");
  if (!source.trim()) return { items: [], warnings: [], dateGuessed: 0 };
  const prepared = source
    .replace(/[，,]\s*(?=(?:\d{4}\s*(?:年|[\/.-])|\d{1,2}\s*月))/g, "\n")
    .replace(/[；;]/g, "\n")
    .replace(/。\s*/g, "\n");
  const lines = prepared
    .split("\n")
    .map((line) => line.trim().replace(/^\s*(?:[•·]|\d{1,2}[、)])\s*/, ""))
    .filter(Boolean);
  const items = [];
  const warnings = [];
  let currentDate = "";
  lines.forEach((line, index) => {
    const dateInfo = extractDate(line, baseDate);
    if (dateInfo) currentDate = dateInfo.iso;
    if (isDateHeaderLine(line, dateInfo)) return;

    const dotDate = extractDotDatePrefix(line, baseDate);
    if (dotDate) {
      if (!dotDate.rest || isHeaderRest(dotDate.rest)) {
        currentDate = dotDate.iso;
        return;
      }
      if (extractAmount(dotDate.rest)) {
        currentDate = dotDate.iso;
        const cleanRest = dotDate.rest.replace(/^[（(]?\s*(?:周|星期)[一二三四五六日天]\s*[)）]?\s*/, "");
        const item = parseTransactionLine(cleanRest || dotDate.rest, baseDate, dotDate.iso);
        if (item) {
          items.push(item);
          return;
        }
      }
    }

    const trimmed = line.trim();
    if (/^(?:收入|支出|收入明细|支出明细|收支明细)[：:]?$/.test(trimmed)) return;
    const item = parseTransactionLine(line, baseDate, currentDate);
    if (item) {
      items.push(item);
    } else {
      warnings.push(`第 ${index + 1} 行没有找到有效金额：${line.slice(0, 28)}`);
    }
  });
  return {
    items,
    warnings,
    dateGuessed: items.filter((item) => item.dateGuessed).length
  };
}

/* ---------- Spreadsheet parser ---------- */
function excelSerialToISO(serial) {
  if (!Number.isFinite(serial) || serial < 1) return "";
  if (window.XLSX && XLSX.SSF && typeof XLSX.SSF.parse_date_code === "function") {
    const parsed = XLSX.SSF.parse_date_code(serial);
    if (parsed && isValidYMD(parsed.y, parsed.m, parsed.d)) {
      return isoFromYMD(parsed.y, parsed.m, parsed.d);
    }
  }
  const date = new Date(Math.round((serial - 25569) * 86400000));
  if (Number.isNaN(date.getTime())) return "";
  const iso = isoFromYMD(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  return isValidISO(iso) ? iso : "";
}

function dateFromCell(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return dateToISO(value);
  }
  if (typeof value === "number" && value > 20000 && value < 80000) {
    return excelSerialToISO(value);
  }
  if (typeof value === "string") {
    const info = extractDate(value, new Date());
    return info ? info.iso : "";
  }
  return "";
}

function amountFromCell(value) {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value === 0) return null;
    const cents = Math.round(Math.abs(value) * 100);
    if (cents < 1 || cents > MAX_AMOUNT_CENTS) return null;
    return cents / 100;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (extractDate(trimmed, new Date()) && !/[¥￥元块]/.test(trimmed)) return null;
    const cents = centsFromAmount(trimmed);
    return cents ? cents / 100 : null;
  }
  return null;
}

function amountSignFromCell(value) {
  if (typeof value === "number" && Number.isFinite(value) && value < 0) return "expense";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^[+＋]/.test(trimmed)) return "income";
    if (/^[-−–—－]/.test(trimmed)) return "expense";
  }
  return "";
}

function normalizeHeader(value) {
  return normalizeName(value).replace(/[\s_/\\\-（）()：:]/g, "").toLowerCase();
}

function typeFromCell(value) {
  const text = normalizeName(value).toLowerCase();
  if (!text) return "";
  if (/^(收入|收|入账|进账|收款|转入|income|credit|in)$/.test(text)) return "income";
  if (/^(支出|支|付款|消费|出账|expense|debit|out)$/.test(text)) return "expense";
  if (/收入/.test(text) && !/支出/.test(text)) return "income";
  if (/支出/.test(text) && !/收入/.test(text)) return "expense";
  return "";
}

function buildHeaderMap(row) {
  const map = { date: -1, name: -1, amount: -1, category: -1, type: -1 };
  if (!Array.isArray(row)) return null;
  row.forEach((cell, index) => {
    const key = normalizeHeader(cell);
    if (!key) return;
    if (map.date < 0 && /(日期|时间|date|day)/.test(key) && !/(金额|支出|花费)/.test(key)) map.date = index;
    if (map.amount < 0 && /(金额|支出|花费|价格|消费额|amount|money|price)/.test(key)) map.amount = index;
    if (map.category < 0 && /(分类|类别|category)/.test(key)) map.category = index;
    if (map.type < 0 && /(类型|收支|方向|交易类型|收入支出|type|direction)/.test(key) && !/(分类|类别)/.test(key)) map.type = index;
    if (map.name < 0 && /(名称|项目|商品|商户|内容|摘要|说明|备注|用途|明细|item|name|desc|description)/.test(key) && !/(金额|支出|价格)/.test(key)) map.name = index;
  });
  const found = Object.values(map).filter((index) => index >= 0).length;
  if (found < 2) return null;
  if (map.amount < 0 && (map.date < 0 || map.name < 0)) return null;
  return map;
}

function detectDateInRow(row) {
  for (const cell of row) {
    const iso = dateFromCell(cell);
    if (iso) return iso;
  }
  return "";
}

function detectAmountInRow(row) {
  const candidates = [];
  row.forEach((cell, index) => {
    if (cell == null || cell === "") return;
    if (typeof cell === "string" && /[年月日\/.-]/.test(cell) && extractDate(cell, new Date())) {
      if (!/[¥￥元块]/.test(cell)) return;
    }
    const amount = amountFromCell(cell);
    if (amount == null) return;
    let score = 0;
    if (typeof cell === "number") score += 2;
    if (typeof cell === "string" && /[¥￥元块]/.test(cell)) score += 2;
    if (typeof cell === "string" && /^-/.test(cell.trim())) score += 1;
    score += index / 100;
    candidates.push({ amount, score });
  });
  candidates.sort((a, b) => b.score - a.score);
  return candidates.length ? candidates[0].amount : null;
}

function detectAmountSignInRow(row) {
  for (const cell of row) {
    if (amountFromCell(cell) == null) continue;
    const sign = amountSignFromCell(cell);
    if (sign) return sign;
  }
  return "";
}

function detectCategoryInRow(row) {
  for (const cell of row) {
    if (typeof cell !== "string") continue;
    const text = normalizeName(cell);
    if (!text || text.length > 8) continue;
    if (typeFromCell(text)) continue;
    const category = normalizeCategory(text);
    if (category) return category;
  }
  return "";
}

function detectTypeInRow(row) {
  for (const cell of row) {
    if (typeof cell !== "string") continue;
    const type = typeFromCell(cell);
    if (type) return type;
  }
  return "";
}

function detectNameInRow(row) {
  const candidates = [];
  row.forEach((cell, index) => {
    if (typeof cell !== "string") return;
    const text = normalizeName(cell);
    if (!text) return;
    if (extractDate(text, new Date()) && text.length <= 20) return;
    if (normalizeCategory(text) === text && text.length <= 4) return;
    const amount = amountFromCell(text);
    if (amount != null) return;
    candidates.push({ text, index });
  });
  candidates.sort((a, b) => b.text.length - a.text.length);
  return candidates.length ? candidates[0].text : "";
}

function isSummaryRow(name) {
  const text = normalizeName(name);
  return /^(?:合计|总计|小计|总额|sum|total)$/i.test(text) || /^(?:合计|总计|小计)/.test(text);
}

function parseSpreadsheetRows(rows, baseDate = new Date()) {
  const sourceRows = (Array.isArray(rows) ? rows : [])
    .map((row) => (Array.isArray(row) ? row : []))
    .filter((row) => row.some((cell) => cell !== null && cell !== undefined && normalizeName(cell) !== ""));
  if (!sourceRows.length) return { items: [], warnings: [], dateGuessed: 0 };

  let headerMap = null;
  let headerIndex = -1;
  for (let i = 0; i < Math.min(6, sourceRows.length); i += 1) {
    const map = buildHeaderMap(sourceRows[i]);
    if (map && (map.amount >= 0 || (map.date >= 0 && map.name >= 0))) {
      headerMap = map;
      headerIndex = i;
      break;
    }
  }

  const dataRows = sourceRows.slice(headerIndex >= 0 ? headerIndex + 1 : 0);
  const items = [];
  const warnings = [];

  dataRows.forEach((row, index) => {
    if (!row.some((cell) => normalizeName(cell) !== "")) return;

    let dateISO = "";
    let amount = null;
    let amountSign = "";
    let name = "";
    let rawCategory = "";
    let rawType = "";

    if (headerMap) {
      if (headerMap.date >= 0) dateISO = dateFromCell(row[headerMap.date]) || "";
      if (headerMap.amount >= 0) {
        amount = amountFromCell(row[headerMap.amount]);
        amountSign = amountSignFromCell(row[headerMap.amount]);
      }
      if (headerMap.name >= 0) name = normalizeName(row[headerMap.name]);
      if (headerMap.category >= 0) rawCategory = normalizeName(row[headerMap.category]);
      if (headerMap.type >= 0) rawType = typeFromCell(row[headerMap.type]);
    }

    if (!dateISO) dateISO = detectDateInRow(row);
    if (amount == null) {
      amount = detectAmountInRow(row);
      amountSign = detectAmountSignInRow(row);
    }
    if (!name) name = detectNameInRow(row);
    if (!rawCategory) rawCategory = detectCategoryInRow(row);
    if (!rawType) rawType = detectTypeInRow(row);

    if (isSummaryRow(name)) return;
    if (amount == null) {
      if (name || dateISO) warnings.push(`第 ${index + 1} 行没有找到有效金额，已跳过`);
      return;
    }
    const dateWasDetected = Boolean(dateISO);
    if (!dateISO) dateISO = todayISO(baseDate);
    if (!name) name = "表格记录";
    if (name.length > 40) name = name.slice(0, 40);

    const normalizedCategory = normalizeCategory(rawCategory);
    let type = rawType || amountSign || (normalizedCategory ? categoryType(normalizedCategory) : "");
    if (!type) type = detectTransactionType(`${name} ${rawCategory}`, null, normalizedCategory);
    if (type !== "income" && type !== "expense") type = "expense";
    const category = normalizedCategory && categoryType(normalizedCategory) === type
      ? normalizedCategory
      : classifyTransaction(name, type);

    items.push({
      id: `imp_${uid()}`,
      date: dateISO,
      name,
      amount: Number(amount.toFixed(2)),
      type,
      category,
      selected: true,
      dateGuessed: !dateWasDetected,
      sourceLine: "表格导入"
    });
  });

  return {
    items,
    warnings,
    dateGuessed: items.filter((item) => item.dateGuessed).length
  };
}
/* ---------- Storage & app state ---------- */
const state = {
  records: [],
  selectedType: "expense",
  selectedCategory: "饮食",
  categoryMemory: { expense: "饮食", income: "工资" },
  categoryRules: { expense: {}, income: {} },
  ocrAliases: {},
  addDate: todayISO(),
  importMode: "text",
  importItems: [],
  ocrFile: null,
  ocrPreviewUrl: "",
  ocrBusy: false,
  billFile: null,
  billBusy: false,
  editingId: null,
  page: "add",
  report: {
    preset: "7d",
    start: addDaysISO(todayISO(), -6),
    end: todayISO(),
    generated: false,
    categoryType: "expense",
    chartType: "expense"
  },
  filters: {
    search: "",
    category: "all",
    type: "all"
  }
};
const el = {};
let toastTimer = null;
let ocrWorker = null;
let ocrWorkerPromise = null;
let tesseractScriptPromise = null;

function normalizeRecord(raw) {
  if (!raw || typeof raw !== "object") return null;
  const type = raw.type === "income" ? "income" : "expense";
  const name = normalizeName(raw.name).slice(0, 40) || (type === "income" ? "未命名收入" : "未命名支出");
  const amount = Number(raw.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const cents = Math.round(amount * 100);
  if (cents < 1 || cents > MAX_AMOUNT_CENTS) return null;
  const date = isValidISO(raw.date) ? raw.date : todayISO();
  const category = CATEGORY_MAP.has(raw.category) && categoryType(raw.category) === type
    ? raw.category
    : classifyTransaction(name, type);
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : uid(),
    date,
    name,
    amount: cents / 100,
    type,
    category,
    externalId: typeof raw.externalId === "string" ? raw.externalId.slice(0, 120) : "",
    source: typeof raw.source === "string" ? raw.source.slice(0, 30) : "",
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString()
  };
}

function categoryRuleKey(name) {
  return normalizeName(name).toLowerCase();
}

function loadCategoryRules() {
  const empty = { expense: {}, income: {} };
  try {
    const parsed = JSON.parse(localStorage.getItem(CATEGORY_RULES_KEY) || "null");
    if (!parsed || typeof parsed !== "object") return empty;
    ["expense", "income"].forEach((type) => {
      const source = parsed[type];
      if (!source || typeof source !== "object") return;
      Object.entries(source).forEach(([key, category]) => {
        if (key && CATEGORY_MAP.has(category) && categoryType(category) === type) {
          empty[type][key] = category;
        }
      });
    });
  } catch (error) {
    console.warn("读取分类学习失败", error);
  }
  return empty;
}

function saveCategoryRules() {
  try {
    localStorage.setItem(CATEGORY_RULES_KEY, JSON.stringify(state.categoryRules));
    return true;
  } catch (error) {
    console.warn("保存分类学习失败", error);
    return false;
  }
}

function learnedCategoryFor(name, type) {
  const key = categoryRuleKey(name);
  if (!key) return "";
  const category = state.categoryRules[type] && state.categoryRules[type][key];
  if (category && CATEGORY_MAP.has(category) && categoryType(category) === type) return category;
  return "";
}

function learnCategory(name, type, category) {
  const key = categoryRuleKey(name);
  if (!key || !CATEGORY_MAP.has(category) || categoryType(category) !== type) return;
  state.categoryRules[type][key] = category;
  const keys = Object.keys(state.categoryRules[type]);
  if (keys.length > 500) {
    delete state.categoryRules[type][keys[0]];
  }
  saveCategoryRules();
}

function syncCategoryForName(name, type, category) {
  const key = categoryRuleKey(name);
  if (!key) return 0;
  let changed = 0;
  state.records.forEach((record) => {
    if (record.type === type && categoryRuleKey(record.name) === key && record.category !== category) {
      record.category = category;
      changed += 1;
    }
  });
  return changed;
}

function loadOcrAliases() {
  try {
    const parsed = JSON.parse(localStorage.getItem(OCR_ALIASES_KEY) || "null");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const aliases = {};
    Object.entries(parsed).forEach(([raw, corrected]) => {
      if (raw && corrected && raw !== corrected) aliases[raw] = String(corrected).slice(0, 40);
    });
    return aliases;
  } catch (error) {
    console.warn("读取 OCR 纠错记忆失败", error);
    return {};
  }
}

function saveOcrAliases() {
  try {
    localStorage.setItem(OCR_ALIASES_KEY, JSON.stringify(state.ocrAliases));
  } catch (error) {
    console.warn("保存 OCR 纠错记忆失败", error);
  }
}

function learnOcrAlias(raw, corrected) {
  const rawKey = normalizeName(raw).slice(0, 60);
  const fixed = normalizeName(corrected).slice(0, 40);
  if (!rawKey || !fixed || rawKey === fixed) return;
  state.ocrAliases[rawKey] = fixed;
  const keys = Object.keys(state.ocrAliases);
  if (keys.length > 500) delete state.ocrAliases[keys[0]];
  saveOcrAliases();
}

function applyOcrAlias(name) {
  return state.ocrAliases[normalizeName(name).slice(0, 60)] || name;
}
function loadRecords() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    let migratedFromLegacy = false;
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      migratedFromLegacy = Boolean(raw);
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set();
    const records = parsed
      .map(normalizeRecord)
      .filter((record) => {
        if (!record || seen.has(record.id)) return false;
        seen.add(record.id);
        return true;
      });
    if (migratedFromLegacy) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      } catch (error) {
        console.warn("迁移旧账本失败", error);
      }
    }
    return records;
  } catch (error) {
    console.warn("读取账本失败", error);
    return [];
  }
}

function saveRecords() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
    return true;
  } catch (error) {
    console.warn("保存账本失败", error);
    showToast("保存失败，请检查浏览器存储空间", "error");
    return false;
  }
}

function sumCents(records) {
  return records.reduce((total, record) => total + Math.round(Number(record.amount) * 100), 0);
}

function recordsOnDate(iso) {
  return state.records.filter((record) => record.date === iso);
}

function recordsInRange(startISO, endISO) {
  return state.records.filter((record) => record.date >= startISO && record.date <= endISO);
}

function aggregateCategories(records, type = "") {
  const map = new Map();
  records.forEach((record) => {
    if (type && record.type !== type) return;
    const cents = Math.round(Number(record.amount) * 100);
    const current = map.get(record.category) || { category: record.category, cents: 0, count: 0, type: record.type };
    current.cents += cents;
    current.count += 1;
    map.set(record.category, current);
  });
  return Array.from(map.values()).sort((a, b) => b.cents - a.cents);
}

function aggregateAllCategories(records) {
  const map = new Map();
  records.forEach((record) => {
    const key = `${record.type}:${record.category}`;
    const cents = Math.round(Number(record.amount) * 100);
    const current = map.get(key) || { category: record.category, cents: 0, count: 0, type: record.type };
    current.cents += cents;
    current.count += 1;
    map.set(key, current);
  });
  return Array.from(map.values()).sort((a, b) => b.cents - a.cents);
}

/* ---------- Element cache ---------- */
function cacheElements() {
  el.headerMonthTotal = $("#headerMonthTotal");
  el.monthPill = $("#monthPill");
  el.menuButton = $("#menuButton");
  el.dataMenu = $("#dataMenu");
  el.dataMenuCount = $("#dataMenuCount");
  el.backupInput = $("#backupInput");
  el.main = $("#main");

  el.greetingText = $("#greetingText");
  el.headingDate = $("#headingDate");
  el.headingWeekday = $("#headingWeekday");
  el.addForm = $("#addForm");
  el.amountInput = $("#amountInput");
  el.amountError = $("#amountError");
  el.amountLabel = $("#amountLabel");
  el.nameInput = $("#nameInput");
  el.nameLabel = $("#nameLabel");
  el.categoryPicker = $("#categoryPicker");
  el.entryTypeSwitch = $("#entryTypeSwitch");
  el.entryTypeHint = $("#entryTypeHint");
  el.quickNames = $("#quickNames");
  el.saveButtonText = $("#saveButtonText");
  el.dateDisplay = $("#dateDisplay");
  el.expenseDate = $("#expenseDate");
  el.dateDisplayText = $("#dateDisplayText");
  el.dateDisplayWeekday = $("#dateDisplayWeekday");
  el.dateQuick = $("#dateQuick");
  el.dateHint = $("#dateHint");
  el.saveButton = $("#saveButton");
  el.todayCardDate = $("#todayCardDate");
  el.todayTotal = $("#todayTotal");
  el.todayExpense = $("#todayExpense");
  el.todayIncome = $("#todayIncome");
  el.todayCount = $("#todayCount");
  el.todayCategories = $("#todayCategories");
  el.monthLabel = $("#monthLabel");
  el.monthTotal = $("#monthTotal");
  el.monthIncome = $("#monthIncome");
  el.monthExpense = $("#monthExpense");
  el.monthCount = $("#monthCount");
  el.monthReportButton = $("#monthReportButton");

  el.importMode = $("#importMode");
  el.textImportPanel = $("#textImportPanel");
  el.fileImportPanel = $("#fileImportPanel");
  el.imageImportPanel = $("#imageImportPanel");
  el.imageInput = $("#imageInput");
  el.imageDropzone = $("#imageDropzone");
  el.imageFileName = $("#imageFileName");
  el.ocrPreview = $("#ocrPreview");
  el.ocrPreviewImage = $("#ocrPreviewImage");
  el.recognizeImageButton = $("#recognizeImageButton");
  el.ocrStatus = $("#ocrStatus");
  el.billImportPanel = $("#billImportPanel");
  el.billInput = $("#billInput");
  el.billDropzone = $("#billDropzone");
  el.billFileName = $("#billFileName");
  el.billZipPassword = $("#billZipPassword");
  el.billStatus = $("#billStatus");
  el.importBillButton = $("#importBillButton");
  el.importText = $("#importText");
  el.sampleButton = $("#sampleButton");
  el.parseTextButton = $("#parseTextButton");
  el.fileInput = $("#fileInput");
  el.dropzone = $("#dropzone");
  el.fileName = $("#fileName");
  el.downloadTemplateButton = $("#downloadTemplateButton");
  el.importPreview = $("#importPreview");
  el.importCount = $("#importCount");
  el.importHint = $("#importHint");
  el.selectAllImports = $("#selectAllImports");
  el.importList = $("#importList");
  el.importExpenseTotal = $("#importExpenseTotal");
  el.importIncomeTotal = $("#importIncomeTotal");
  el.confirmImportButton = $("#confirmImportButton");

  el.rangePresets = $("#rangePresets");
  el.rangeStart = $("#rangeStart");
  el.rangeEnd = $("#rangeEnd");
  el.generateReportButton = $("#generateReportButton");
  el.rangeError = $("#rangeError");
  el.reportEmpty = $("#reportEmpty");
  el.reportResult = $("#reportResult");
  el.reportPeriodLabel = $("#reportPeriodLabel");
  el.reportDayCount = $("#reportDayCount");
  el.reportExpenseTotal = $("#reportExpenseTotal");
  el.reportIncomeTotal = $("#reportIncomeTotal");
  el.reportNet = $("#reportNet");
  el.reportRecordCount = $("#reportRecordCount");
  el.reportAvg = $("#reportAvg");
  el.reportCategoryType = $("#reportCategoryType");
  el.reportChartType = $("#reportChartType");
  el.chartTitle = $("#chartTitle");
  el.chartSubtitle = $("#chartSubtitle");
  el.chartLegend = $("#chartLegend");
  el.categorySubtitle = $("#categorySubtitle");
  el.categoryDonut = $("#categoryDonut");
  el.donutTotal = $("#donutTotal");
  el.donutLabel = $("#donutLabel");
  el.categoryLegend = $("#categoryLegend");
  el.chartBadge = $("#chartBadge");
  el.chartYAxis = $("#chartYAxis");
  el.dailyChart = $("#dailyChart");
  el.chartTip = $("#chartTip");
  el.dailyListSummary = $("#dailyListSummary");
  el.dailyList = $("#dailyList");

  el.recordsSummaryCount = $("#recordsSummaryCount");
  el.recordsSummaryTotal = $("#recordsSummaryTotal");
  el.recordsSummaryFlow = $("#recordsSummaryFlow");
  el.recordSearch = $("#recordSearch");
  el.recordTypeFilter = $("#recordTypeFilter");
  el.recordCategoryFilter = $("#recordCategoryFilter");
  el.recordsList = $("#recordsList");
  el.recordsEmpty = $("#recordsEmpty");
  el.recordsEmptyTitle = $("#recordsEmptyTitle");
  el.recordsEmptyText = $("#recordsEmptyText");

  el.recordDialog = $("#recordDialog");
  el.editForm = $("#editForm");
  el.editAmount = $("#editAmount");
  el.editName = $("#editName");
  el.editType = $("#editType");
  el.editCategory = $("#editCategory");
  el.editDate = $("#editDate");
  el.editError = $("#editError");
  el.deleteRecordButton = $("#deleteRecordButton");
  el.closeRecordDialog = $("#closeRecordDialog");
  el.confirmDialog = $("#confirmDialog");
  el.confirmTitle = $("#confirmTitle");
  el.confirmMessage = $("#confirmMessage");
  el.confirmOkButton = $("#confirmOkButton");
  el.toast = $("#toast");
  el.pages = $$(".page");
  el.navButtons = $$("[data-nav]");
}

/* ---------- Category pickers ---------- */
function buildCategoryPicker(type = state.selectedType) {
  el.categoryPicker.innerHTML = categoriesForType(type).map((category) => `
    <button class="category-chip" type="button" data-category="${escapeHTML(category.name)}" aria-pressed="false" style="${categoryStyle(category.name)}">
      <span class="cat-icon">${iconMarkup(category.icon)}</span>
      <span>${escapeHTML(category.name)}</span>
    </button>
  `).join("");
  updateCategoryPicker();
}

function updateCategoryPicker() {
  $$(".category-chip", el.categoryPicker).forEach((button) => {
    const active = button.dataset.category === state.selectedCategory;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function buildQuickNameData(type) {
  const cutoff = addDaysISO(todayISO(), -7);
  const groups = new Map();
  state.records.forEach((record) => {
    if (record.type !== type) return;
    const name = normalizeName(record.name);
    if (!name || name.startsWith("未命名")) return;
    const entry = groups.get(name) || {
      name,
      count: 0,
      lastDate: "",
      latestDate: "",
      latestCategory: "",
      categories: new Map()
    };
    entry.count += 1;
    if (record.date > entry.lastDate) entry.lastDate = record.date;
    if (record.date >= entry.latestDate) {
      entry.latestDate = record.date;
      entry.latestCategory = record.category;
    }
    entry.categories.set(record.category, (entry.categories.get(record.category) || 0) + 1);
    groups.set(name, entry);
  });

  const groupsList = Array.from(groups.values());
  const qualified = groupsList.filter((entry) => entry.count >= 5);
  const active = qualified
    .filter((entry) => entry.lastDate >= cutoff)
    .sort((a, b) => (b.count - a.count) || b.lastDate.localeCompare(a.lastDate) || a.name.localeCompare(b.name))
    .slice(0, 5)
    .map((entry) => {
      let category = entry.latestCategory;
      let bestCount = 0;
      entry.categories.forEach((count, candidate) => {
        if (count > bestCount) {
          bestCount = count;
          category = candidate;
        }
      });
      return { name: entry.name, category: category || defaultCategoryForType(type), count: entry.count };
    });

  return {
    items: active,
    activated: qualified.length > 0
  };
}

function renderQuickNames(type = state.selectedType) {
  const defaults = type === "income"
    ? [["工资", "工资"], ["奖金", "奖金"], ["兼职", "兼职"], ["理财", "理财"], ["红包", "红包"]]
    : [["奶茶", "饮食"], ["午饭", "饮食"], ["打车", "交通"], ["游戏充值", "游戏"], ["网购", "购物"]];
  const data = buildQuickNameData(type);
  const label = `<span class="quick-label" title="记录满 5 次、且最近 7 天用过的名称，会自动出现在这里">常记</span>`;
  if (data.items.length) {
    el.quickNames.innerHTML = `${label}${data.items.map((item) => `
      <button type="button" data-quick-name="${escapeHTML(item.name)}" data-quick-category="${escapeHTML(item.category)}" title="记录过 ${item.count} 次">${escapeHTML(item.name)}</button>
    `).join("")}`;
    return;
  }
  if (data.activated) {
    el.quickNames.innerHTML = `${label}<span class="quick-empty">最近一周没有常记，再记一次就会回来</span>`;
    return;
  }
  el.quickNames.innerHTML = `${label}${defaults.map(([name, category]) => `
    <button type="button" data-quick-name="${escapeHTML(name)}" data-quick-category="${escapeHTML(category)}">${escapeHTML(name)}</button>
  `).join("")}`;
}

function refreshRecordCategoryFilter() {
  const type = state.filters.type;
  const groups = [];
  if (type !== "income") groups.push({ label: "支出", categories: EXPENSE_CATEGORIES });
  if (type !== "expense") groups.push({ label: "收入", categories: INCOME_CATEGORIES });
  el.recordCategoryFilter.innerHTML = [
    `<option value="all">全部分类</option>`,
    ...groups.map((group) => `<optgroup label="${group.label}">${group.categories.map((category) => `<option value="${escapeHTML(category.name)}">${escapeHTML(category.name)}</option>`).join("")}</optgroup>`)
  ].join("");
  el.recordCategoryFilter.value = state.filters.category;
}

function buildRecordCategoryFilter() {
  refreshRecordCategoryFilter();
}

function buildEditCategoryOptions(type = "expense", selected = "") {
  el.editCategory.innerHTML = categoriesForType(type).map((category) => `<option value="${escapeHTML(category.name)}"${category.name === selected ? " selected" : ""}>${escapeHTML(category.name)}</option>`).join("");
}

function setEntryType(type, options = {}) {
  const nextType = type === "income" ? "income" : "expense";
  if (state.selectedType === nextType && !options.force) return;
  state.categoryMemory[state.selectedType] = state.selectedCategory;
  state.selectedType = nextType;
  state.selectedCategory = state.categoryMemory[nextType] || defaultCategoryForType(nextType);
  $$("[data-entry-type]", el.entryTypeSwitch).forEach((button) => {
    const active = button.dataset.entryType === nextType;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  el.amountLabel.textContent = nextType === "income" ? "收入金额" : "支出金额";
  el.nameLabel.textContent = nextType === "income" ? "这笔收入来自哪里" : "花在了什么上";
  el.nameInput.placeholder = nextType === "income" ? "比如：这个月工资" : "比如：楼下的冰美式";
  el.entryTypeHint.textContent = nextType === "income" ? "这笔钱进来了" : "这笔钱花出去了";
  el.saveButtonText.textContent = nextType === "income" ? "记下这笔收入" : "记下这笔支出";
  el.addForm.classList.toggle("is-income", nextType === "income");
  buildCategoryPicker(nextType);
  renderQuickNames(nextType);
}

/* ---------- Add page ---------- */
function setGreeting() {
  const hour = new Date().getHours();
  let greeting = "晚上好";
  if (hour < 5) greeting = "夜深了";
  else if (hour < 9) greeting = "早上好";
  else if (hour < 12) greeting = "上午好";
  else if (hour < 14) greeting = "中午好";
  else if (hour < 18) greeting = "下午好";
  el.greetingText.textContent = greeting;
  const now = new Date();
  const iso = dateToISO(now);
  el.headingDate.textContent = formatCnDate(iso);
  el.headingWeekday.textContent = weekdayName(iso);
}

function renderDateQuick() {
  const today = todayISO();
  const chips = [];
  for (let offset = 0; offset > -7; offset -= 1) {
    const iso = addDaysISO(today, offset);
    const active = iso === state.addDate;
    const label = offset === 0 ? "今天" : offset === -1 ? "昨天" : weekdayShort(iso);
    chips.push(`
      <button class="date-chip${active ? " is-active" : ""}" type="button" data-date="${iso}" aria-pressed="${active}">
        <span>${label}</span>
        <strong>${formatShortNumeric(iso)}</strong>
      </button>
    `);
  }
  el.dateQuick.innerHTML = chips.join("");
}

function setAddDate(iso) {
  if (!isValidISO(iso)) return;
  state.addDate = iso;
  el.expenseDate.value = iso;
  el.dateDisplayText.textContent = formatCnDate(iso);
  el.dateDisplayWeekday.textContent = weekdayName(iso);
  const today = todayISO();
  el.dateHint.textContent = iso === today ? "默认今天" : `已选择 ${formatMonthDay(iso)}`;
  renderDateQuick();
}

function openDatePicker() {
  el.expenseDate.value = state.addDate;
  if (typeof el.expenseDate.showPicker === "function") {
    try {
      el.expenseDate.showPicker();
      return;
    } catch (error) {
      // Some browsers only allow showPicker from certain gestures; fall through.
    }
  }
  el.expenseDate.focus({ preventScroll: true });
}

function renderAddOverview() {
  const today = todayISO();
  const todayRecords = recordsOnDate(today);
  const todayTotals = sumByType(todayRecords);
  el.todayCardDate.textContent = formatMonthDay(today);
  el.todayTotal.textContent = formatSignedMoney(todayTotals.net);
  el.todayTotal.classList.toggle("is-negative", todayTotals.net < 0);
  el.todayExpense.textContent = formatMoney(todayTotals.expense);
  el.todayIncome.textContent = formatMoney(todayTotals.income);
  el.todayCount.textContent = todayRecords.length ? `${todayRecords.length} 笔记录` : "今天还没有收支记录";

  const todayCategories = aggregateAllCategories(todayRecords);
  el.todayCategories.innerHTML = todayCategories.length
    ? todayCategories.slice(0, 3).map((item) => `
        <span class="today-cat ${item.type}" style="${categoryStyle(item.category)}">
          <i></i>${escapeHTML(item.category)} ${item.type === "income" ? "+" : "−"}${formatMoney(item.cents)}
        </span>
      `).join("")
    : `<span class="empty-note">第一笔，从今天开始。</span>`;

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
  const monthRecords = state.records.filter((record) => record.date.startsWith(monthPrefix));
  const monthTotals = sumByType(monthRecords);

  el.headerMonthTotal.textContent = formatSignedMoney(monthTotals.net);
  el.monthLabel.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月`;
  el.monthTotal.textContent = formatSignedMoney(monthTotals.net);
  el.monthTotal.classList.toggle("is-negative", monthTotals.net < 0);
  el.monthTotal.classList.toggle("is-positive", monthTotals.net > 0);
  el.monthIncome.textContent = formatMoney(monthTotals.income);
  el.monthExpense.textContent = formatMoney(monthTotals.expense);
  el.monthCount.textContent = `${monthRecords.length} 笔`;
  el.dataMenuCount.textContent = `${state.records.length} 笔记录`;
}

function showAmountError(show) {
  el.amountError.hidden = !show;
  el.amountInput.setAttribute("aria-invalid", show ? "true" : "false");
}

function handleAddSubmit(event) {
  event.preventDefault();
  const cents = centsFromAmount(el.amountInput.value);
  if (!cents) {
    showAmountError(true);
    el.amountInput.focus();
    return;
  }
  showAmountError(false);
  const type = state.selectedType;
  const name = normalizeName(el.nameInput.value).slice(0, 40) || (type === "income" ? "未命名收入" : "未命名支出");
  const record = normalizeRecord({
    id: uid(),
    date: state.addDate,
    name,
    amount: cents / 100,
    type,
    category: state.selectedCategory,
    createdAt: new Date().toISOString()
  });
  if (!record) {
    showToast("这笔记录有点问题，请检查后再试", "error");
    return;
  }
  state.records.push(record);
  if (!saveRecords()) {
    state.records.pop();
    return;
  }
  if (record.category !== classifyTransaction(name, type)) {
    learnCategory(name, type, record.category);
  }
  el.amountInput.value = "";
  el.nameInput.value = "";
  showAmountError(false);
  renderAll();
  showToast(`已记下：${record.name} ${formatSignedMoney(type === "income" ? cents : -cents)}`);
  el.amountInput.focus({ preventScroll: true });
}

function renderAll() {
  renderAddOverview();
  renderQuickNames(state.selectedType);
  renderRecords();
  if (state.report.generated) renderReport();
}
/* ---------- Import page ---------- */
function setImportMode(mode) {
  state.importMode = mode === "file" ? "file" : mode === "image" ? "image" : mode === "bill" ? "bill" : "text";
  $$("button", el.importMode).forEach((button) => {
    const active = button.dataset.importMode === state.importMode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  el.textImportPanel.hidden = state.importMode !== "text";
  el.fileImportPanel.hidden = state.importMode !== "file";
  el.imageImportPanel.hidden = state.importMode !== "image";
  el.billImportPanel.hidden = state.importMode !== "bill";
}

function categoryOptions(selected) {
  return [
    `<optgroup label="支出">${EXPENSE_CATEGORIES.map((category) => `<option value="${escapeHTML(category.name)}"${category.name === selected ? " selected" : ""}>${escapeHTML(category.name)}</option>`).join("")}</optgroup>`,
    `<optgroup label="收入">${INCOME_CATEGORIES.map((category) => `<option value="${escapeHTML(category.name)}"${category.name === selected ? " selected" : ""}>${escapeHTML(category.name)}</option>`).join("")}</optgroup>`
  ].join("");
}

function renderImportPreview() {
  const items = state.importItems;
  if (!items.length) {
    el.importPreview.hidden = true;
    el.importList.innerHTML = "";
    return;
  }
  el.importPreview.hidden = false;
  el.importCount.textContent = String(items.length);
  el.importHint.textContent = state.importHint || "每一笔都可以修改。+ 收入、- 支出优先按符号判断。";

  el.importList.innerHTML = items.map((item) => `
    <div class="import-row ${item.type === "income" ? "type-income" : "type-expense"}${item.selected ? "" : " is-unselected"}" data-id="${escapeHTML(item.id)}" data-type="${item.type}" style="${categoryStyle(item.category)}">
      <label class="row-check">
        <input type="checkbox" data-field="selected" ${item.selected ? "checked" : ""} aria-label="选择这一笔">
      </label>
      <label class="imp-field imp-name">
        <span class="sr-only">记录名称</span>
        <span class="imp-type-badge ${item.type}" data-type-badge>${item.type === "income" ? "收" : "支"}</span>
        <input type="text" data-field="name" value="${escapeHTML(item.name)}" maxlength="40" placeholder="记录名称">
      </label>
      <label class="imp-field imp-date">
        <span class="sr-only">日期</span>
        <input type="date" data-field="date" value="${escapeHTML(item.date)}">
      </label>
      <label class="imp-field imp-cat">
        <span class="sr-only">分类</span>
        <select data-field="category">${categoryOptions(item.category)}</select>
      </label>
      <label class="imp-field imp-amount">
        <span class="sr-only">金额</span>
        <span class="yen" aria-hidden="true">¥</span>
        <input type="text" data-field="amount" inputmode="decimal" value="${escapeHTML(Number(item.amount).toFixed(2))}" maxlength="12">
      </label>
      <button class="row-remove" type="button" data-action="remove-import" aria-label="移除这一笔">
        ${iconMarkup("close")}
      </button>
    </div>
  `).join("");

  const allSelected = items.every((item) => item.selected);
  el.selectAllImports.checked = allSelected;
  el.selectAllImports.indeterminate = !allSelected && items.some((item) => item.selected);
  updateImportSummary();
}

function updateImportSummary() {
  const selected = state.importItems.filter((item) => item.selected);
  let expense = 0;
  let income = 0;
  selected.forEach((item) => {
    const cents = centsFromAmount(item.amount);
    if (!cents) return;
    if (item.type === "income") income += cents;
    else expense += cents;
  });
  el.importExpenseTotal.textContent = `支出 ${formatMoney(expense)}`;
  el.importIncomeTotal.textContent = `收入 ${formatMoney(income)}`;
  el.confirmImportButton.textContent = `确认导入 ${selected.length} 笔`;
  el.confirmImportButton.disabled = selected.length === 0;
}

function getImportItem(id) {
  return state.importItems.find((item) => item.id === id);
}

function handleImportListInput(event) {
  const row = event.target.closest(".import-row");
  if (!row) return;
  const item = getImportItem(row.dataset.id);
  if (!item) return;
  const field = event.target.dataset.field;
  if (field === "amount") {
    event.target.value = sanitizeAmountInput(event.target.value);
    item.amount = event.target.value;
  } else if (field === "name") {
    item.name = event.target.value;
  } else if (field === "date") {
    item.date = event.target.value;
  }
  row.classList.remove("is-invalid");
  updateImportSummary();
}

function handleImportListChange(event) {
  const row = event.target.closest(".import-row");
  if (!row) return;
  const item = getImportItem(row.dataset.id);
  if (!item) return;
  const field = event.target.dataset.field;
  if (field === "selected") {
    item.selected = event.target.checked;
    row.classList.toggle("is-unselected", !item.selected);
    const allSelected = state.importItems.every((entry) => entry.selected);
    el.selectAllImports.checked = allSelected;
    el.selectAllImports.indeterminate = !allSelected && state.importItems.some((entry) => entry.selected);
    updateImportSummary();
  } else if (field === "name") {
    item.name = event.target.value;
    if (item.ocrName) learnOcrAlias(item.ocrName, item.name);
  } else if (field === "category") {
    item.category = event.target.value;
    item.type = categoryType(item.category);
    learnCategory(item.name, item.type, item.category);
    row.dataset.type = item.type;
    row.classList.toggle("type-income", item.type === "income");
    row.classList.toggle("type-expense", item.type === "expense");
    row.style.cssText = categoryStyle(item.category);
    const badge = row.querySelector("[data-type-badge]");
    if (badge) {
      badge.textContent = item.type === "income" ? "收" : "支";
      badge.className = `imp-type-badge ${item.type}`;
    }
    updateImportSummary();
  }
}

function removeImportItem(id) {
  state.importItems = state.importItems.filter((item) => item.id !== id);
  renderImportPreview();
}

function parseCurrentText() {
  const text = el.importText.value.trim();
  if (!text) {
    showToast("先粘贴一段账单文字吧", "error");
    el.importText.focus();
    return;
  }
  const result = parseText(text);
  if (!result.items.length) {
    showToast(result.warnings[0] || "没有识别到可导入的收支", "error");
    return;
  }
  state.importItems = result.items;
  state.importHint = result.dateGuessed
    ? `每一笔都可以修改。有 ${result.dateGuessed} 笔没有写日期，已按今天填好；+ 收入、- 支出优先按符号判断。`
    : "每一笔都可以修改；+ 收入、- 支出优先按符号判断。";
  renderImportPreview();
  el.importPreview.scrollIntoView({ behavior: "smooth", block: "start" });
  if (result.warnings.length) {
    showToast(`已识别 ${result.items.length} 笔，${result.warnings.length} 行未识别`, "error");
  } else {
    showToast(`已识别 ${result.items.length} 笔，请确认`);
  }
}

function loadSampleText() {
  el.importText.value = [
    "2026年11月8日",
    "中饭：-10",
    "奶茶：-18",
    "项目奖金：+2000",
    "2026年11月7日",
    "打车：-23.5",
    "收到红包：+200",
    "2026年11月6日",
    "超市买水果：-35.8"
  ].join("\n");
  setImportMode("text");
  parseCurrentText();
}

function downloadImportTemplate() {
  const rows = [
    ["日期", "类型", "名称", "金额", "分类"],
    ["2026-11-08", "支出", "早餐", "12.50", "饮食"],
    ["2026-11-07", "支出", "打车", "23.00", "交通"],
    ["2026-11-05", "收入", "工资", "8000.00", "工资"],
    ["2026-11-04", "收入", "退款", "59.00", "退款"]
  ];
  const csv = "\uFEFF" + rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "东东账本-导入模板.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
  showToast("模板已下载，按表头填写即可");
}

async function handleSpreadsheetFile(file) {
  if (!file) return;
  el.fileName.textContent = `已选择：${file.name}`;
  if (!window.XLSX) {
    showToast("表格解析组件没有加载，请刷新页面后重试", "error");
    return;
  }
  try {
    const buffer = await file.arrayBuffer();
    let workbook;
    if (file.name.toLowerCase().endsWith(".csv") && typeof TextDecoder !== "undefined") {
      let csvText;
      try {
        csvText = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      } catch (error) {
        csvText = new TextDecoder("gb18030").decode(buffer);
      }
      workbook = XLSX.read(csvText, { type: "string", cellDates: true });
    } else {
      workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    }
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("工作表为空");
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      raw: true,
      defval: null,
      blankrows: false
    });
    const result = parseSpreadsheetRows(rows);
    if (!result.items.length) {
      showToast("表格里没有找到可导入的收支，请检查表头", "error");
      return;
    }
    state.importItems = result.items;
    state.importHint = result.dateGuessed
      ? `已读取「${sheetName}」。有 ${result.dateGuessed} 笔没有日期，已按今天填好；带 + / - 的金额会按符号判断。`
      : `已读取「${sheetName}」，每一笔都可以修改；带 + / - 的金额会按符号判断。`;
    renderImportPreview();
    el.importPreview.scrollIntoView({ behavior: "smooth", block: "start" });
    if (result.warnings.length) {
      showToast(`已识别 ${result.items.length} 笔，${result.warnings.length} 行跳过`, "error");
    } else {
      showToast(`已识别 ${result.items.length} 笔，请确认`);
    }
  } catch (error) {
    console.error(error);
    showToast("这个表格没有读出来，请确认文件格式", "error");
  }
}

/* ---------- WeChat / Alipay official bill import ---------- */
let zipConfigured = false;

function setBillStatus(message, options = {}) {
  if (!el.billStatus) return;
  el.billStatus.textContent = message;
  el.billStatus.classList.toggle("is-busy", Boolean(options.busy));
  el.billStatus.classList.toggle("is-error", Boolean(options.error));
}

function handleBillFile(file) {
  if (!file) return;
  if (!/\.(zip|xlsx|xls|csv)$/i.test(file.name)) {
    showToast("请选择微信/支付宝导出的 ZIP、XLSX、XLS 或 CSV", "error");
    return;
  }
  state.billFile = file;
  state.importItems = [];
  state.importHint = "";
  el.importPreview.hidden = true;
  el.billFileName.textContent = file.name;
  el.billZipPassword.value = "";
  el.importBillButton.disabled = false;
  setBillStatus("文件已选择，点“读取账单”开始识别");
}

async function loadZipScript() {
  if (window.zip) return window.zip;
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL("vendor/zip/zip.min.js", location.href).href;
    script.onload = resolve;
    script.onerror = () => reject(new Error("ZIP 组件加载失败"));
    document.head.appendChild(script);
  });
  if (!window.zip) throw new Error("ZIP 组件不可用");
  return window.zip;
}

async function extractZipBill(file, password) {
  const lib = await loadZipScript();
  if (!zipConfigured && typeof lib.configure === "function") {
    lib.configure({ useWebWorkers: false });
    zipConfigured = true;
  }
  const reader = new lib.ZipReader(new lib.BlobReader(file), { password: password || undefined });
  try {
    const entries = await reader.getEntries();
    const candidates = entries
      .filter((entry) => !entry.directory && /\.(csv|xlsx|xls)$/i.test(entry.filename || ""))
      .sort((a, b) => (b.uncompressedSize || 0) - (a.uncompressedSize || 0));
    if (!candidates.length) throw new Error("ZIP 里没有找到 CSV/XLSX 账单文件");
    const entry = candidates[0];
    const data = await entry.getData(new lib.Uint8ArrayWriter());
    const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    return { buffer, name: entry.filename || file.name, platformHint: "" };
  } finally {
    await reader.close().catch(() => {});
  }
}

function officialPlatform(rows, filename) {
  const head = rows.slice(0, 30).flat().map((cell) => normalizeName(cell)).join(" ");
  const text = `${head} ${filename || ""}`;
  if (/微信支付|微信账单|微信/.test(text)) return "微信";
  if (/支付宝|alipay/i.test(text)) return "支付宝";
  return "官方账单";
}

function buildOfficialHeaderMap(row) {
  const map = { date: -1, name: -1, amount: -1, type: -1, status: -1, externalId: -1 };
  if (!Array.isArray(row)) return null;
  row.forEach((cell, index) => {
    const key = normalizeHeader(cell);
    if (!key) return;
    if (map.date < 0 && /(交易时间|交易日期|付款时间|创建时间|时间)/.test(key)) map.date = index;
    if (map.name < 0 && /(交易对方|对方|商户名称|交易对象|收款方|付款方|商户|名称)/.test(key)) map.name = index;
    if (map.amount < 0 && /(金额|交易金额|订单金额)/.test(key)) map.amount = index;
    if (map.type < 0 && /^(收支|收入支出|资金方向|借贷方向|收付方向)$/.test(key)) map.type = index;
    if (map.status < 0 && /(当前状态|交易状态|状态)/.test(key)) map.status = index;
    if (map.externalId < 0 && /(交易单号|交易订单号|订单号|流水号|交易号)/.test(key)) map.externalId = index;
  });
  return map.date >= 0 && map.name >= 0 && map.amount >= 0 && map.type >= 0 ? map : null;
}

function officialDate(value) {
  const iso = dateFromCell(value);
  if (iso) return iso;
  const match = String(value == null ? "" : value).match(/(20\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if (match && isValidYMD(Number(match[1]), Number(match[2]), Number(match[3]))) {
    return isoFromYMD(Number(match[1]), Number(match[2]), Number(match[3]));
  }
  return "";
}

function parseOfficialBillRows(rows, filename = "") {
  const sourceRows = (Array.isArray(rows) ? rows : [])
    .map((row) => (Array.isArray(row) ? row : []))
    .filter((row) => row.some((cell) => cell !== null && cell !== undefined && normalizeName(cell) !== ""));
  if (!sourceRows.length) return { items: [], warnings: [], platform: "", skipped: 0, headerRow: -1 };

  let headerMap = null;
  let headerIndex = -1;
  for (let i = 0; i < Math.min(50, sourceRows.length); i += 1) {
    const map = buildOfficialHeaderMap(sourceRows[i]);
    if (map) {
      headerMap = map;
      headerIndex = i;
      break;
    }
  }
  if (!headerMap) throw new Error("没有找到官方账单表头");

  const platform = officialPlatform(sourceRows, filename);
  const dataRows = sourceRows.slice(headerIndex + 1);
  const items = [];
  const warnings = [];
  let skipped = 0;

  dataRows.forEach((row, index) => {
    if (!row.some((cell) => normalizeName(cell) !== "")) return;
    const rowNumber = headerIndex + index + 2;
    const type = typeFromCell(row[headerMap.type]);
    if (!type) {
      skipped += 1;
      return;
    }
    const status = headerMap.status >= 0 ? normalizeName(row[headerMap.status]) : "";
    if (status && /(关闭|失败|取消|撤销|已失效|待付款|处理中|退款关闭)/.test(status)) {
      skipped += 1;
      return;
    }
    const date = officialDate(row[headerMap.date]);
    if (!date) {
      warnings.push(`第 ${rowNumber} 行没有识别到日期，已跳过`);
      skipped += 1;
      return;
    }
    const amount = amountFromCell(row[headerMap.amount]);
    if (amount == null) {
      warnings.push(`第 ${rowNumber} 行没有识别到金额，已跳过`);
      skipped += 1;
      return;
    }
    const name = normalizeName(row[headerMap.name]).slice(0, 40)
      || (type === "income" ? "未命名收入" : "未命名支出");
    const rawExternalId = headerMap.externalId >= 0 ? normalizeName(row[headerMap.externalId]) : "";
    items.push({
      id: `imp_${uid()}`,
      date,
      name,
      amount: Number(amount.toFixed(2)),
      type,
      category: classifyTransaction(name, type),
      selected: true,
      dateGuessed: false,
      externalId: rawExternalId ? `${platform}:${rawExternalId}` : "",
      source: `${platform}账单`,
      sourceLine: `${platform}账单`
    });
  });

  return { items, warnings, platform, skipped, headerRow: headerIndex + 1 };
}

function rowsFromWorkbookBuffer(buffer, filename) {
  if (!window.XLSX) throw new Error("表格组件没有加载");
  let workbook;
  if (/\.csv$/i.test(filename)) {
    let text;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch (error) {
      text = new TextDecoder("gb18030").decode(buffer);
    }
    workbook = XLSX.read(text, { type: "string", cellDates: true });
  } else {
    workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  }
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("工作表为空");
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false
  });
}

async function importOfficialBill() {
  if (!state.billFile || state.billBusy) return;
  state.billBusy = true;
  el.importBillButton.disabled = true;
  setBillStatus("正在读取账单...", { busy: true });
  try {
    let buffer;
    let name = state.billFile.name;
    if (/\.zip$/i.test(name)) {
      setBillStatus("正在解压账单...", { busy: true });
      const extracted = await extractZipBill(state.billFile, el.billZipPassword.value);
      buffer = extracted.buffer;
      name = extracted.name;
    } else {
      buffer = await state.billFile.arrayBuffer();
    }
    setBillStatus("正在解析交易记录...", { busy: true });
    const rows = rowsFromWorkbookBuffer(buffer, name);
    const parsed = parseOfficialBillRows(rows, name);
    if (!parsed.items.length) throw new Error("没有找到可导入的收支记录");
    const existingIds = new Set(state.records.map((record) => record.externalId).filter(Boolean));
    const seen = new Set();
    let duplicates = 0;
    const items = [];
    parsed.items.forEach((item) => {
      if (item.externalId) {
        if (existingIds.has(item.externalId) || seen.has(item.externalId)) {
          duplicates += 1;
          return;
        }
        seen.add(item.externalId);
      }
      items.push(item);
    });
    if (!items.length) {
      const duplicateError = new Error(`这 ${duplicates} 笔账单都已经导入过了`);
      duplicateError.code = "ALL_DUPLICATES";
      duplicateError.count = duplicates;
      throw duplicateError;
    }
    state.importItems = items;
    el.billZipPassword.value = "";
    const sourceLabel = parsed.platform === "微信" ? "微信账单" : parsed.platform === "支付宝" ? "支付宝账单" : "官方账单";
    state.importHint = `已读取${sourceLabel}：${items.length} 笔；日期、名称、金额和分类都可以修改。`;
    if (duplicates) state.importHint += ` 已自动跳过 ${duplicates} 笔之前导入过的交易。`;
    if (parsed.skipped) state.importHint += ` 有 ${parsed.skipped} 行不是有效收支或状态不可用，已跳过。`;
    renderImportPreview();
    setBillStatus(`识别完成：${items.length} 笔，请核对下方结果`);
    el.importPreview.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast(`已读取${sourceLabel} ${items.length} 笔${duplicates ? `，跳过重复 ${duplicates} 笔` : ""}`);
  } catch (error) {
    console.error(error);
    if (error && error.code === "ALL_DUPLICATES") {
      state.importItems = [];
      state.importHint = "";
      el.importPreview.hidden = true;
      setBillStatus(`这 ${error.count} 笔都已导入过，无需重复导入`);
      showToast(`这 ${error.count} 笔都已导入过`);
      return;
    }
    const message = /password|密码|encrypted/i.test(String(error && error.message))
      ? "ZIP 密码不正确，或压缩包已损坏"
      : "账单没有读出来，请确认是微信/支付宝官方导出文件";
    setBillStatus(message, { error: true });
    showToast(message, "error");
  } finally {
    state.billBusy = false;
    el.importBillButton.disabled = !state.billFile;
  }
}
/* ---------- WeChat bill screenshot OCR ---------- */
function loadTesseractScript() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (tesseractScriptPromise) return tesseractScriptPromise;
  tesseractScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL("vendor/tesseract/tesseract.min.js", location.href).href;
    script.onload = () => resolve(window.Tesseract);
    script.onerror = () => reject(new Error("OCR component failed to load"));
    document.head.appendChild(script);
  }).catch((error) => {
    tesseractScriptPromise = null;
    throw error;
  });
  return tesseractScriptPromise;
}

function setOcrStatus(message, options = {}) {
  if (!el.ocrStatus) return;
  el.ocrStatus.textContent = message;
  el.ocrStatus.classList.toggle("is-busy", Boolean(options.busy));
  el.ocrStatus.classList.toggle("is-error", Boolean(options.error));
}

function ocrProgressMessage(progress) {
  const percent = Math.round((progress.progress || 0) * 100);
  if (progress.status === "loading language traineddata") return `正在加载中文识别模型 ${percent}%`;
  if (progress.status === "initializing api") return "正在启动识别引擎...";
  if (progress.status === "recognizing text") return `正在识别文字 ${percent}%`;
  return progress.status ? `${progress.status} ${percent}%` : "正在准备识别...";
}

async function resetOcrWorker() {
  if (ocrWorker) {
    try { await ocrWorker.terminate(); } catch (error) { console.warn(error); }
  }
  ocrWorker = null;
  ocrWorkerPromise = null;
  return getOcrWorker();
}

async function getOcrWorker() {
  if (ocrWorker) return ocrWorker;
  if (ocrWorkerPromise) return ocrWorkerPromise;
  ocrWorkerPromise = (async () => {
    await loadTesseractScript();
    const worker = await Tesseract.createWorker("chi_sim+eng", 1, {
      workerPath: new URL("vendor/tesseract/worker.min.js", location.href).href,
      corePath: new URL("vendor/tesseract-core", location.href).href,
      langPath: new URL("vendor/tessdata", location.href).href,
      logger: (progress) => {
        if (state.ocrBusy) setOcrStatus(ocrProgressMessage(progress), { busy: true });
      }
    });
    await worker.setParameters({
      tessedit_pageseg_mode: "6",
      preserve_interword_spaces: "1",
      user_defined_dpi: "300"
    });
    ocrWorker = worker;
    return worker;
  })().catch((error) => {
    ocrWorkerPromise = null;
    throw error;
  });
  return ocrWorkerPromise;
}

function makeOcrCanvas(image, crop, scale, threshold) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(crop.w * scale));
  canvas.height = Math.max(1, Math.round(crop.h * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.filter = "grayscale(1) contrast(1.25)";
  context.drawImage(image, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height);
  if (threshold) {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let index = 0; index < data.length; index += 4) {
      const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
      const value = gray < threshold ? 0 : 255;
      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = value;
    }
    context.putImageData(imageData, 0, 0);
  }
  return canvas;
}

function handleOcrImageFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    showToast("请选择 PNG / JPG / WebP 图片", "error");
    return;
  }
  if (state.ocrPreviewUrl) URL.revokeObjectURL(state.ocrPreviewUrl);
  state.ocrFile = file;
  state.ocrPreviewUrl = URL.createObjectURL(file);
  el.ocrPreviewImage.src = state.ocrPreviewUrl;
  el.ocrPreview.hidden = false;
  el.imageFileName.textContent = file.name;
  el.recognizeImageButton.disabled = false;
  setOcrStatus("截图已选择，可以开始识别");
}

function collectOcrLines(data) {
  const lines = [];
  (data.blocks || []).forEach((block) => {
    (block.paragraphs || []).forEach((paragraph) => {
      (paragraph.lines || []).forEach((line) => {
        if (!line.text) return;
        lines.push({
          text: line.text,
          bbox: line.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 },
          confidence: Number(line.confidence) || 0
        });
      });
    });
  });
  return lines;
}

function ocrCenterY(line, scale, offset = 0) {
  const bbox = line.bbox || {};
  return ((bbox.y0 + bbox.y1) / 2) / scale + offset;
}

function parseOcrAmount(text) {
  let value = String(text || "").replace(/\s+/g, "").replace(/[”"'’]/g, ".");
  value = value.replace(/[~一]/g, "-");
  const match = value.match(/([+\-−])?(\d{1,5})[.,](\d{2})$/);
  if (!match) return null;
  const amount = Number(`${match[2]}.${match[3]}`);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return {
    amount,
    sign: match[1] === "+" ? "+" : match[1] ? "-" : ""
  };
}

function parseOcrDate(text, fallbackMonth) {
  const match = String(text || "").match(/(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]?\s*(\d{1,2})[:：.．](\d{2})/);
  if (!match) return null;
  let month = Number(match[1]);
  const day = Number(match[2]);
  if (month === 1 && fallbackMonth >= 10) month = fallbackMonth;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month, day };
}

function cleanOcrName(text) {
  let name = String(text || "")
    .replace(/\s+/g, " ")
    .replace(/[“”"’|¦\[\]（）()【】]+$/g, "")
    .replace(/[…\.]{2,}$/g, "")
    .trim();
  name = name.replace(/^[^\u4e00-\u9fff]{1,20}(?=[\u4e00-\u9fff])/, "");
  name = name.replace(/^[0-9%]+\s+(?=[A-Za-z])/, "");
  name = name.replace(/(?<=[\u4e00-\u9fff])\d$/, "");
  return name.trim().slice(0, 40);
}

function isOcrNameLine(line, fallbackMonth) {
  const text = String(line.text || "").replace(/\s+/g, " ").trim();
  if (!text || line.confidence < 45) return false;
  if (parseOcrDate(text, fallbackMonth)) return false;
  const meaningful = text.replace(/[^\p{L}\p{N}\u4e00-\u9fff]/gu, "").replace(/一/g, "");
  return meaningful.length >= 2;
}

function parseOcrBill(fullData, dateData, meta) {
  const fullText = String(fullData.text || "");
  const headerText = fullText.slice(0, 260);
  const headerMatch = headerText.match(/(20\d{2})\D{0,4}(\d{1,2})\s*月/);
  const currentYear = new Date().getFullYear();
  let year = headerMatch ? Number(headerMatch[1]) : currentYear;
  const headerMonth = headerMatch ? Number(headerMatch[2]) : 0;
  const fallbackMonth = headerMonth || new Date().getMonth() + 1;

  const allDateLines = collectOcrLines(dateData).map((line) => ({
    line,
    text: String(line.text || "").replace(/\s+/g, " ").trim(),
    y: ocrCenterY(line, meta.dateScale, meta.dateOffsetY)
  }));

  const dateEntries = [];
  allDateLines.forEach((entry) => {
    const parsed = parseOcrDate(entry.text, fallbackMonth);
    if (!parsed) return;
    const candidates = allDateLines
      .filter((other) => other !== entry && other.y < entry.y && entry.y - other.y < 190 && isOcrNameLine(other.line, fallbackMonth))
      .sort((a, b) => b.y - a.y);
    const name = candidates.length ? cleanOcrName(candidates[0].text) : "";
    dateEntries.push({ ...entry, ...parsed, name });
  });
  const fullDateLines = collectOcrLines(fullData).map((line) => ({
    line,
    text: String(line.text || "").replace(/\s+/g, " ").trim(),
    y: ocrCenterY(line, meta.fullScale, 0)
  }));
  fullDateLines.forEach((entry) => {
    const parsed = parseOcrDate(entry.text, fallbackMonth);
    if (!parsed) return;
    if (dateEntries.some((existing) => Math.abs(existing.y - entry.y) < 35)) return;
    dateEntries.push({ ...entry, ...parsed, name: "" });
  });
  dateEntries.sort((a, b) => a.y - b.y);

  if (dateEntries.length) {
    const monthCounts = {};
    dateEntries.forEach((entry) => { monthCounts[entry.month] = (monthCounts[entry.month] || 0) + 1; });
    const modeMonth = Number(Object.keys(monthCounts).sort((a, b) => monthCounts[b] - monthCounts[a])[0]);
    dateEntries.forEach((entry) => {
      if (entry.month === 1 && (headerMonth >= 10 || modeMonth >= 10)) entry.month = modeMonth >= 10 ? modeMonth : headerMonth;
    });
  }

  const amountLines = collectOcrLines(fullData).map((line) => {
    const parsed = parseOcrAmount(line.text);
    if (!parsed) return null;
    return {
      line,
      text: String(line.text || "").replace(/\s+/g, " ").trim(),
      amount: parsed.amount,
      sign: parsed.sign,
      y: ocrCenterY(line, meta.fullScale, 0)
    };
  }).filter(Boolean).sort((a, b) => a.y - b.y);

  const usedDates = new Set();
  const items = [];
  let dateGuessed = 0;
  amountLines.forEach((amountLine) => {
    let match = null;
    dateEntries.forEach((entry, index) => {
      if (usedDates.has(index)) return;
      const diff = entry.y - amountLine.y;
      if (diff <= -30 || diff >= 115) return;
      const score = Math.abs(diff - 45);
      if (!match || score < match.score) match = { entry, index, score };
    });
    if (!match && !amountLine.sign) return;

    let date = "";
    let dateWasGuessed = false;
    let name = "";
    if (match) {
      usedDates.add(match.index);
      const entry = match.entry;
      const dateYear = headerMonth && entry.month > headerMonth + 1 ? year - 1 : year;
      const iso = `${dateYear}-${pad2(entry.month)}-${pad2(entry.day)}`;
      if (isValidISO(iso)) date = iso;
      name = entry.name;
    }
    if (!date) {
      date = todayISO();
      dateWasGuessed = true;
      dateGuessed += 1;
    }
    const fullName = cleanOcrName(amountLine.text.replace(/[+\-−~]?\d{1,5}[.,]\d{2}\s*$/, ""));
    if (!name) name = fullName;
    else if (fullName && fullName.startsWith(name)) {
      const extension = fullName.slice(name.length).trim();
      if (extension && /^[\u4e00-\u9fff]{1,8}$/.test(extension)) name = fullName;
    }
    if (!name) name = amountLine.sign === "+" ? "未命名收入" : "未命名支出";
    const ocrName = name;
    name = applyOcrAlias(name);
    let type = amountLine.sign === "+" ? "income" : amountLine.sign === "-" ? "expense" : "expense";
    if (!amountLine.sign) type = detectTransactionType(name);
    items.push({
      id: `imp_${uid()}`,
      date,
      name,
      ocrName,
      amount: Number(amountLine.amount.toFixed(2)),
      type,
      category: classifyTransaction(name, type),
      selected: true,
      dateGuessed: dateWasGuessed,
      sourceLine: amountLine.text
    });
  });

  return {
    items,
    warnings: dateGuessed ? [`有 ${dateGuessed} 笔没有识别到日期，已按今天填好`] : [],
    dateGuessed,
    year,
    headerMonth
  };
}

async function recognizeBillScreenshot() {
  if (!state.ocrFile || state.ocrBusy) return;
  if (location.protocol === "file:") {
    setOcrStatus("截图识别需要通过网址打开，不能直接双击 HTML 文件", { error: true });
    showToast("请用本地预览网址打开后再识别截图", "error");
    return;
  }
  state.ocrBusy = true;
  el.recognizeImageButton.disabled = true;
  setOcrStatus("正在准备识别...", { busy: true });
  let tempUrl = "";
  try {
    let worker = await getOcrWorker();
    tempUrl = URL.createObjectURL(state.ocrFile);
    const image = new Image();
    image.src = tempUrl;
    await image.decode();
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (!width || !height) throw new Error("图片无法读取");
    const fullScale = Math.max(0.6, Math.min(2, 1800 / width));
    const cropX = Math.round(width * 0.205);
    const cropY = Math.round(height * 0.075);
    const cropW = Math.round(width * 0.423);
    const cropH = height - cropY;
    const dateScale = Math.max(1, Math.min(3, 1800 / cropW));
    const fullCanvas = makeOcrCanvas(image, { x: 0, y: 0, w: width, h: height }, fullScale, 220);
    const dateCanvas = makeOcrCanvas(image, { x: cropX, y: cropY, w: cropW, h: cropH }, dateScale, 215);
    setOcrStatus("正在识别整张账单...", { busy: true });
    let fullResult;
    try {
      fullResult = await worker.recognize(fullCanvas, {}, { text: true, blocks: true });
    } catch (error) {
      console.warn("OCR 组件第一次加载失败，正在自动重试", error);
      setOcrStatus("识别组件加载失败，正在自动重试...", { busy: true });
      worker = await resetOcrWorker();
      fullResult = await worker.recognize(fullCanvas, {}, { text: true, blocks: true });
    }
    setOcrStatus("正在识别每笔日期...", { busy: true });
    const dateResult = await worker.recognize(dateCanvas, {}, { text: true, blocks: true });
    let parsed = parseOcrBill(fullResult.data, dateResult.data, {
      fullScale,
      dateScale,
      dateOffsetX: cropX,
      dateOffsetY: cropY,
      imageWidth: width,
      imageHeight: height
    });
    const scoreParsed = (result) => result.items.length * 100 - result.dateGuessed * 30;
    if (parsed.dateGuessed > 0 && parsed.items.length > 0) {
      setOcrStatus("日期有点模糊，正在尝试增强识别...", { busy: true });
      const altDateCanvas = makeOcrCanvas(image, { x: cropX, y: cropY, w: cropW, h: cropH }, dateScale, 235);
      const altDateResult = await worker.recognize(altDateCanvas, {}, { text: true, blocks: true });
      const altParsed = parseOcrBill(fullResult.data, altDateResult.data, {
        fullScale,
        dateScale,
        dateOffsetX: cropX,
        dateOffsetY: cropY,
        imageWidth: width,
        imageHeight: height
      });
      if (scoreParsed(altParsed) > scoreParsed(parsed)) parsed = altParsed;
    }
    if (!parsed.items.length) {
      setOcrStatus("第一次没读全，正在用增强模式重试...", { busy: true });
      const altFullCanvas = makeOcrCanvas(image, { x: 0, y: 0, w: width, h: height }, fullScale, 235);
      const altDateCanvas = makeOcrCanvas(image, { x: cropX, y: cropY, w: cropW, h: cropH }, dateScale, 235);
      const altFullResult = await worker.recognize(altFullCanvas, {}, { text: true, blocks: true });
      const altDateResult = await worker.recognize(altDateCanvas, {}, { text: true, blocks: true });
      const altParsed = parseOcrBill(altFullResult.data, altDateResult.data, {
        fullScale,
        dateScale,
        dateOffsetX: cropX,
        dateOffsetY: cropY,
        imageWidth: width,
        imageHeight: height
      });
      if (scoreParsed(altParsed) > scoreParsed(parsed)) parsed = altParsed;
    }
    if (!parsed.items.length) throw new Error("没有识别到可读取的账单条目");
    state.importItems = parsed.items;
    state.importHint = `从截图识别到 ${parsed.items.length} 笔；日期、名称和分类都可以修改。`;
    if (parsed.dateGuessed) state.importHint += ` 有 ${parsed.dateGuessed} 笔未识别到日期，已按今天填好。`;
    if (parsed.items.length && parsed.dateGuessed >= Math.ceil(parsed.items.length / 2)) {
      state.importHint += " 这张截图的字体比较特殊，日期可能识别不准，请重点核对。";
    }
    renderImportPreview();
    setOcrStatus(`识别完成：${parsed.items.length} 笔，请核对下方结果`);
    el.importPreview.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast(`已从截图识别 ${parsed.items.length} 笔`);
  } catch (error) {
    console.error(error);
    setOcrStatus("截图识别失败，请换一张更清晰的截图重试", { error: true });
    showToast("截图识别失败，请确认截图清晰、完整", "error");
  } finally {
    if (tempUrl) URL.revokeObjectURL(tempUrl);
    state.ocrBusy = false;
    el.recognizeImageButton.disabled = !state.ocrFile;
  }
}
function confirmImport() {
  const selected = state.importItems.filter((item) => item.selected);
  if (!selected.length) {
    showToast("至少选择一笔再导入", "error");
    return;
  }
  const invalid = [];
  const newRecords = [];
  selected.forEach((item) => {
    const cents = centsFromAmount(item.amount);
    const type = item.type === "income" ? "income" : "expense";
    const name = normalizeName(item.name).slice(0, 40) || (type === "income" ? "未命名收入" : "未命名支出");
    if (!cents || !isValidISO(item.date)) {
      invalid.push(item);
      return;
    }
    const category = CATEGORY_MAP.has(item.category) && categoryType(item.category) === type
      ? item.category
      : classifyTransaction(name, type);
    const record = normalizeRecord({
      id: uid(),
      date: item.date,
      name,
      amount: cents / 100,
      type,
      category,
      externalId: item.externalId || "",
      source: item.source || "导入",
      createdAt: new Date().toISOString()
    });
    if (record) newRecords.push(record);
    else invalid.push(item);
  });

  if (invalid.length) {
    $$(".import-row", el.importList).forEach((row) => {
      if (invalid.some((item) => item.id === row.dataset.id)) row.classList.add("is-invalid");
    });
    showToast(`有 ${invalid.length} 笔日期或金额不完整，请修改`, "error");
    return;
  }

  const totals = sumByType(newRecords);
  state.records.push(...newRecords);
  if (!saveRecords()) {
    state.records.splice(state.records.length - newRecords.length, newRecords.length);
    return;
  }
  state.importItems = [];
  state.importHint = "";
  el.importText.value = "";
  el.fileInput.value = "";
  el.fileName.textContent = "还没有选择文件";
  state.billFile = null;
  el.billInput.value = "";
  el.billFileName.textContent = "支持 CSV / XLSX / 加密 ZIP";
  el.billZipPassword.value = "";
  el.importBillButton.disabled = true;
  setBillStatus("选择文件后读取账单");
  el.importPreview.hidden = true;
  renderAll();
  showToast(`已导入 ${newRecords.length} 笔：支出 ${formatMoney(totals.expense)} · 收入 ${formatMoney(totals.income)}`);
  setPage("records");
}
/* ---------- Report page ---------- */
function syncReportInputs() {
  el.rangeStart.value = state.report.start;
  el.rangeEnd.value = state.report.end;
}

function presetRange(preset, baseDate = new Date()) {
  const today = todayISO(baseDate);
  if (preset === "week") {
    const day = baseDate.getDay();
    const offset = (day + 6) % 7;
    return { start: addDaysISO(today, -offset), end: today };
  }
  if (preset === "month") {
    const start = `${baseDate.getFullYear()}-${pad2(baseDate.getMonth() + 1)}-01`;
    return { start, end: today };
  }
  if (preset === "30d") {
    return { start: addDaysISO(today, -29), end: today };
  }
  if (preset === "custom") {
    return { start: state.report.start, end: state.report.end };
  }
  return { start: addDaysISO(today, -6), end: today };
}

function setActivePreset(preset) {
  $$("button", el.rangePresets).forEach((button) => {
    button.classList.toggle("is-active", button.dataset.preset === preset);
  });
}

function applyPreset(preset, shouldGenerate = true) {
  state.report.preset = preset;
  if (preset !== "custom") {
    const range = presetRange(preset);
    state.report.start = range.start;
    state.report.end = range.end;
  }
  setActivePreset(preset);
  syncReportInputs();
  el.rangeError.hidden = true;
  if (shouldGenerate) generateReport();
}

function showRangeError(message) {
  el.rangeError.textContent = message;
  el.rangeError.hidden = false;
}

function compactMoney(cents) {
  const yuan = Number(cents) / 100;
  if (!Number.isFinite(yuan)) return "¥0";
  if (yuan >= 10000) return `¥${(yuan / 10000).toFixed(1)}万`;
  if (yuan >= 1000) return `¥${Math.round(yuan)}`;
  return `¥${moneyFormatter.format(yuan)}`;
}

function generateReport() {
  const start = el.rangeStart.value;
  const end = el.rangeEnd.value;
  if (!isValidISO(start) || !isValidISO(end)) {
    showRangeError("请选择完整的开始和结束日期");
    return;
  }
  if (start > end) {
    showRangeError("开始日期不能晚于结束日期");
    return;
  }
  const days = daysBetween(start, end) + 1;
  if (days > MAX_REPORT_DAYS) {
    showRangeError(`一次最多统计 ${MAX_REPORT_DAYS} 天，请缩小范围`);
    return;
  }
  el.rangeError.hidden = true;
  state.report.start = start;
  state.report.end = end;
  state.report.generated = true;
  const rangeTotals = sumByType(recordsInRange(start, end));
  if (rangeTotals.expense === 0 && rangeTotals.income > 0) {
    state.report.categoryType = "income";
    state.report.chartType = "income";
  } else if (rangeTotals.income === 0 && rangeTotals.expense > 0) {
    state.report.categoryType = "expense";
    state.report.chartType = "expense";
  }
  renderReport();
}

function renderReport() {
  if (!state.report.generated) return;
  const start = state.report.start;
  const end = state.report.end;
  const days = daysBetween(start, end) + 1;
  const records = recordsInRange(start, end);
  const totals = sumByType(records);

  el.reportPeriodLabel.textContent = `${formatNumericDate(start)} — ${formatNumericDate(end)}`;
  el.reportDayCount.textContent = `共 ${days} 天`;

  if (!records.length) {
    el.reportResult.hidden = true;
    el.reportEmpty.hidden = false;
    return;
  }
  el.reportEmpty.hidden = true;
  el.reportResult.hidden = false;

  const categoryType = state.report.categoryType === "income" ? "income" : "expense";
  const avgCents = Math.round(totals.expense / days);

  el.reportExpenseTotal.textContent = formatMoney(totals.expense);
  el.reportIncomeTotal.textContent = formatMoney(totals.income);
  el.reportNet.textContent = formatSignedMoney(totals.net);
  el.reportNet.classList.toggle("is-negative", totals.net < 0);
  el.reportNet.classList.toggle("is-positive", totals.net > 0);
  el.reportRecordCount.textContent = `${records.length} 笔`;
  el.reportAvg.textContent = formatMoney(avgCents);

  const daily = [];
  for (let offset = 0; offset < days; offset += 1) {
    const date = addDaysISO(start, offset);
    const dayRecords = records.filter((record) => record.date === date);
    const dayTotals = sumByType(dayRecords);
    daily.push({
      date,
      expense: dayTotals.expense,
      income: dayTotals.income,
      net: dayTotals.net,
      count: dayRecords.length
    });
  }
  const maxExpenseDaily = Math.max(...daily.map((item) => item.expense), 1);

  const categoryTotals = aggregateCategories(records, categoryType);
  const categoryTotalCents = categoryType === "income" ? totals.income : totals.expense;
  const categoryLabel = categoryType === "income" ? "收入" : "支出";
  el.categorySubtitle.textContent = categoryType === "income" ? "收入来自哪里" : "支出花在哪里";
  el.donutLabel.textContent = `${categoryLabel}合计`;
  el.donutTotal.textContent = formatMoney(categoryTotalCents);
  $$("button", el.reportCategoryType).forEach((button) => {
    const active = button.dataset.categoryType === categoryType;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  if (categoryTotals.length && categoryTotalCents > 0) {
    let cursor = 0;
    const segments = categoryTotals.map((item, index) => {
      const category = CATEGORY_MAP.get(item.category) || CATEGORY_MAP.get("其他");
      const from = cursor;
      cursor += (item.cents / categoryTotalCents) * 100;
      const to = index === categoryTotals.length - 1 ? 100 : cursor;
      return `${category.color} ${from.toFixed(2)}% ${to.toFixed(2)}%`;
    });
    el.categoryDonut.style.background = `conic-gradient(${segments.join(", ")})`;
    el.categoryLegend.innerHTML = categoryTotals.map((item) => {
      const percent = (item.cents / categoryTotalCents) * 100;
      return `
        <div class="legend-item" style="${categoryStyle(item.category)}">
          <span class="legend-dot"></span>
          <span class="legend-name">${escapeHTML(item.category)}</span>
          <span class="legend-amount">${formatMoney(item.cents)}<small>${percent.toFixed(1)}%</small></span>
          <span class="legend-bar"><span style="width:${percent.toFixed(2)}%"></span></span>
        </div>
      `;
    }).join("");
  } else {
    el.categoryDonut.style.background = "conic-gradient(rgba(44, 68, 57, 0.09) 0 100%)";
    el.categoryLegend.innerHTML = `<p class="category-empty">这段时间没有${categoryLabel}分类记录</p>`;
  }

  const chartType = state.report.chartType === "income" ? "income" : "expense";
  const chartLabel = chartType === "income" ? "收入" : "支出";
  const chartValues = daily.map((item) => item[chartType]);
  const maxChart = Math.max(...chartValues, 1);
  el.chartTitle.textContent = `每日${chartLabel}`;
  el.chartSubtitle.textContent = chartType === "income" ? "哪几天有进账" : "哪几天花得比较多";
  el.chartLegend.innerHTML = `<span><i class="${chartType}"></i>${chartLabel}</span>`;
  $$("button", el.reportChartType).forEach((button) => {
    const active = button.dataset.chartType === chartType;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  el.chartBadge.textContent = `${days} 天`;
  el.chartTip.hidden = days <= 12;
  el.chartYAxis.innerHTML = [
    compactMoney(maxChart),
    compactMoney(Math.round(maxChart / 2)),
    "¥0"
  ].map((label) => `<span>${label}</span>`).join("");

  if (days > 12) {
    el.dailyChart.style.width = `${Math.max(100, days * 42)}px`;
  } else {
    el.dailyChart.style.width = "100%";
  }
  el.dailyChart.innerHTML = `
    <div class="chart-gridlines"><span></span><span></span><span></span></div>
    <div class="chart-bars">
      ${daily.map((item, index) => {
        const value = item[chartType];
        const height = value ? Math.max(3, (value / maxChart) * 100) : 0;
        const delay = Math.min(index * 22, 300);
        const isToday = item.date === todayISO();
        return `
          <div class="chart-col${isToday ? " is-today" : ""}" title="${escapeHTML(formatMonthDay(item.date))} ${chartLabel} ${formatMoney(value)}">
            <div class="bar-fill ${chartType}${value ? "" : " is-empty"}" style="--bar-height:${height.toFixed(2)}%;--delay:${delay}ms"></div>
            <span class="bar-date">${formatShortNumeric(item.date)}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;

  const activeDays = daily.filter((item) => item.count > 0).length;
  el.dailyListSummary.textContent = `${activeDays} 天有记录 · 支出 ${formatMoney(totals.expense)} · 收入 ${formatMoney(totals.income)}`;
  const reversedDaily = [...daily].reverse();
  el.dailyList.innerHTML = reversedDaily.map((item) => {
    const percent = item.expense ? Math.max(2, (item.expense / maxExpenseDaily) * 100) : 0;
    const classes = ["daily-row"];
    if (!item.count) classes.push("is-zero");
    if (item.date === todayISO()) classes.push("is-today");
    return `
      <div class="${classes.join(" ")}">
        <div class="daily-date">
          <strong>${formatMonthDay(item.date)}</strong>
          <small>${weekdayShort(item.date)}${item.count ? ` · ${item.count} 笔` : ""}</small>
        </div>
        <div class="daily-bar-wrap">
          <div class="daily-bar-track"><span style="width:${percent.toFixed(2)}%"></span></div>
        </div>
        <div class="daily-amounts">
          <span class="out">${item.expense ? `−${formatMoney(item.expense)}` : "—"}</span>
          <span class="in">${item.income ? `+${formatMoney(item.income)}` : "—"}</span>
          <span class="daily-total ${item.count ? (item.net < 0 ? "negative" : item.net > 0 ? "positive" : "zero") : "zero"}">总计 ${item.count ? formatSignedMoney(item.net) : "—"}</span>
        </div>
      </div>
    `;
  }).join("");
}
/* ---------- Records page ---------- */
function recordDateTitle(iso) {
  const date = parseISO(iso);
  if (!date) return iso;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() ? formatCnDate(iso, false) : formatCnDate(iso, true);
}

function filteredRecords() {
  const search = state.filters.search.trim().toLowerCase();
  return state.records.filter((record) => {
    if (state.filters.type !== "all" && record.type !== state.filters.type) return false;
    if (state.filters.category !== "all" && record.category !== state.filters.category) return false;
    if (search && !`${record.name} ${record.category}`.toLowerCase().includes(search)) return false;
    return true;
  });
}

function renderRecords() {
  const records = filteredRecords().sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });
  const totals = sumByType(records);
  el.recordsSummaryCount.textContent = `${records.length} 笔`;
  el.recordsSummaryTotal.textContent = `结余 ${formatSignedMoney(totals.net)}`;
  el.recordsSummaryFlow.textContent = `支出 ${formatMoney(totals.expense)} · 收入 ${formatMoney(totals.income)}`;

  if (!records.length) {
    el.recordsList.innerHTML = "";
    el.recordsEmpty.hidden = false;
    if (!state.records.length) {
      el.recordsEmptyTitle.textContent = "账本还是空的";
      el.recordsEmptyText.textContent = "记下第一笔收入或支出，往后的日子就有迹可循。";
    } else {
      el.recordsEmptyTitle.textContent = "没有找到匹配的记录";
      el.recordsEmptyText.textContent = "换个关键词或分类试试，或者去记下新的一笔。";
    }
    return;
  }
  el.recordsEmpty.hidden = true;

  const groups = new Map();
  records.forEach((record) => {
    if (!groups.has(record.date)) groups.set(record.date, []);
    groups.get(record.date).push(record);
  });

  el.recordsList.innerHTML = Array.from(groups.entries()).map(([date, groupRecords]) => {
    const groupTotals = sumByType(groupRecords);
    return `
      <article class="record-group">
        <div class="record-group-head">
          <h3>${escapeHTML(recordDateTitle(date))}<small>${weekdayShort(date)}</small></h3>
          <span>${formatSignedMoney(groupTotals.net)}</span>
        </div>
        <div class="group-list">
          ${groupRecords.map((record) => {
            const cents = Math.round(record.amount * 100);
            const signed = record.type === "income" ? cents : -cents;
            const category = CATEGORY_MAP.get(record.category) || CATEGORY_MAP.get("其他");
            return `
              <button class="record-row ${record.type}" type="button" data-record-id="${escapeHTML(record.id)}" style="${categoryStyle(record.category)}" aria-label="修改 ${escapeHTML(record.name)} ${formatSignedMoney(signed)}">
                <span class="record-icon">${iconMarkup(category.icon)}</span>
                <span class="record-info">
                  <strong>${escapeHTML(record.name)}</strong>
                  <small>${escapeHTML(record.category)}</small>
                </span>
                <span class="record-amount ${record.type}">${formatSignedMoney(signed)}</span>
                <svg class="icon" aria-hidden="true"><use href="#i-chevron"/></svg>
              </button>
            `;
          }).join("")}
        </div>
      </article>
    `;
  }).join("");
}
/* ---------- Toast, dialogs, data menu ---------- */
function showToast(message, type = "success") {
  if (!el.toast) return;
  clearTimeout(toastTimer);
  el.toast.textContent = message;
  el.toast.classList.toggle("is-error", type === "error");
  el.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => {
    el.toast.classList.remove("is-visible");
  }, type === "error" ? 3400 : 2300);
}

function syncModalState() {
  const hasOpenDialog = Boolean((el.recordDialog && el.recordDialog.open) || (el.confirmDialog && el.confirmDialog.open));
  document.body.classList.toggle("modal-open", hasOpenDialog);
}

function askConfirm({ title = "确认操作", message = "这一步无法撤销。", confirmText = "确认删除" }) {
  return new Promise((resolve) => {
    el.confirmTitle.textContent = title;
    el.confirmMessage.textContent = message;
    el.confirmOkButton.textContent = confirmText;
    el.confirmDialog.returnValue = "";
    if (el.confirmDialog.open) el.confirmDialog.close();
    el.confirmDialog.showModal();
    syncModalState();
    const handleClose = () => {
      el.confirmDialog.removeEventListener("close", handleClose);
      syncModalState();
      resolve(el.confirmDialog.returnValue === "confirm");
    };
    el.confirmDialog.addEventListener("close", handleClose);
  });
}

function openRecordDialog(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record) return;
  state.editingId = id;
  el.editAmount.value = Number(record.amount).toFixed(2);
  el.editName.value = record.name;
  el.editType.value = record.type;
  buildEditCategoryOptions(record.type, record.category);
  el.editDate.value = record.date;
  el.editError.hidden = true;
  if (!el.recordDialog.open) el.recordDialog.showModal();
  syncModalState();
}

function closeRecordDialog() {
  if (el.recordDialog.open) el.recordDialog.close();
  syncModalState();
}

function handleEditSubmit(event) {
  event.preventDefault();
  const record = state.records.find((item) => item.id === state.editingId);
  if (!record) {
    closeRecordDialog();
    return;
  }
  const cents = centsFromAmount(el.editAmount.value);
  const name = normalizeName(el.editName.value).slice(0, 40);
  const date = el.editDate.value;
  if (!cents || !name || !isValidISO(date)) {
    el.editError.hidden = false;
    return;
  }
  el.editError.hidden = true;
  const type = el.editType.value === "income" ? "income" : "expense";
  const selectedCategory = el.editCategory.value;
  const category = CATEGORY_MAP.has(selectedCategory) && categoryType(selectedCategory) === type
    ? selectedCategory
    : classifyTransaction(name, type);
  const oldRecords = state.records.map((item) => ({ ...item }));
  const index = state.records.findIndex((item) => item.id === record.id);
  const categoryChanged = category !== record.category;
  state.records[index] = {
    ...record,
    name,
    date,
    type,
    amount: cents / 100,
    category
  };
  const synced = categoryChanged ? syncCategoryForName(name, type, category) : 0;
  if (!saveRecords()) {
    state.records = oldRecords;
    return;
  }
  if (categoryChanged) {
    learnCategory(name, type, category);
  }
  const typeLabel = type === "income" ? "收入" : "支出";
  renderAll();
  closeRecordDialog();
  if (categoryChanged && synced > 0) {
    showToast(`已更新，并同步了 ${synced} 笔同名${typeLabel}的分类`);
  } else if (categoryChanged) {
    showToast(`已更新；以后同名${typeLabel}会自动归到「${category}」`);
  } else {
    showToast(`已更新：${name}`);
  }
}

async function handleDeleteRecord() {
  const record = state.records.find((item) => item.id === state.editingId);
  if (!record) return;
  const confirmed = await askConfirm({
    title: "删除这一笔？",
    message: `「${record.name} · ${formatSignedMoney(record.type === "income" ? Math.round(record.amount * 100) : -Math.round(record.amount * 100))}」将从账本中移除，无法撤销。`,
    confirmText: "确认删除"
  });
  if (!confirmed) return;
  const oldRecords = state.records;
  state.records = state.records.filter((item) => item.id !== record.id);
  if (!saveRecords()) {
    state.records = oldRecords;
    return;
  }
  renderAll();
  closeRecordDialog();
  showToast("这一笔已删除");
}

/* ---------- Backup ---------- */
function exportBackup() {
  if (!state.records.length) {
    showToast("账本还是空的，暂时没有可导出的记录", "error");
    return;
  }
  const payload = {
    app: "东东账本",
    version: 10,
    exportedAt: new Date().toISOString(),
    records: state.records
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `东东账本-备份-${todayISO()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
  showToast(`已导出 ${state.records.length} 笔记录`);
}

async function handleBackupFile(file) {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const list = Array.isArray(parsed) ? parsed : parsed && parsed.records;
    if (!Array.isArray(list)) throw new Error("备份格式不正确");
    const clean = list.map(normalizeRecord).filter(Boolean);
    if (!clean.length) throw new Error("备份里没有有效记录");
    const existingIds = new Set(state.records.map((record) => record.id));
    const newRecords = clean.filter((record) => !existingIds.has(record.id));
    if (!newRecords.length) {
      showToast("备份里的记录已经在账本里了");
      return;
    }
    const oldRecords = state.records;
    state.records = [...state.records, ...newRecords];
    if (!saveRecords()) {
      state.records = oldRecords;
      return;
    }
    renderAll();
    showToast(`已导入 ${newRecords.length} 笔备份记录`);
  } catch (error) {
    console.warn(error);
    showToast("备份文件读不出来，请确认是东东账本的备份", "error");
  }
}

async function clearAllRecords() {
  if (!state.records.length) {
    showToast("账本已经是空的了");
    return;
  }
  const confirmed = await askConfirm({
    title: "清空所有记录？",
    message: `将删除全部 ${state.records.length} 笔记录，无法撤销。建议先导出一份备份。`,
    confirmText: "确认清空"
  });
  if (!confirmed) return;
  const oldRecords = state.records;
  state.records = [];
  if (!saveRecords()) {
    state.records = oldRecords;
    return;
  }
  renderAll();
  showToast("账本已清空");
}

/* ---------- Navigation & menu ---------- */
function closeDataMenu() {
  if (!el.dataMenu || el.dataMenu.hidden) return;
  el.dataMenu.hidden = true;
  el.menuButton.setAttribute("aria-expanded", "false");
}

function toggleDataMenu(force) {
  const shouldOpen = typeof force === "boolean" ? force : el.dataMenu.hidden;
  el.dataMenu.hidden = !shouldOpen;
  el.menuButton.setAttribute("aria-expanded", String(shouldOpen));
  if (shouldOpen) el.dataMenuCount.textContent = `${state.records.length} 笔记录`;
}

function setPage(page) {
  const allowed = ["add", "import", "report", "records"];
  const nextPage = allowed.includes(page) ? page : "add";
  state.page = nextPage;
  el.pages.forEach((section) => {
    const active = section.dataset.page === nextPage;
    section.hidden = !active;
    section.classList.toggle("is-active", active);
  });
  el.navButtons.forEach((button) => {
    const active = button.dataset.nav === nextPage;
    button.classList.toggle("is-active", active);
    if (button.classList.contains("nav-item") || button.classList.contains("bottom-item")) {
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    }
  });
  if (nextPage === "records") renderRecords();
  if (nextPage === "report" && !state.report.generated) {
    applyPreset(state.report.preset || "7d", false);
    generateReport();
  }
  closeDataMenu();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function openMonthReport() {
  applyPreset("month", true);
  setPage("report");
}

/* ---------- Event bindings ---------- */
function bindNavigation() {
  document.addEventListener("click", (event) => {
    const navTarget = event.target.closest("[data-nav]");
    if (navTarget) {
      event.preventDefault();
      setPage(navTarget.dataset.nav);
    }
  });
  el.monthPill.addEventListener("click", openMonthReport);
  el.monthReportButton.addEventListener("click", openMonthReport);
}

function bindAddForm() {
  el.amountInput.addEventListener("input", () => {
    const sanitized = sanitizeAmountInput(el.amountInput.value);
    if (el.amountInput.value !== sanitized) el.amountInput.value = sanitized;
    if (sanitized) showAmountError(false);
  });
  el.amountInput.addEventListener("blur", () => {
    if (el.amountInput.value && centsFromAmount(el.amountInput.value)) {
      el.amountInput.value = Number(el.amountInput.value).toFixed(2);
    }
  });
  el.nameInput.addEventListener("input", () => {
    if (el.nameInput.value.trim()) showAmountError(false);
  });
  el.entryTypeSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("[data-entry-type]");
    if (!button) return;
    setEntryType(button.dataset.entryType);
    if (el.nameInput.value.trim()) {
      state.selectedCategory = classifyTransaction(el.nameInput.value, state.selectedType);
      state.categoryMemory[state.selectedType] = state.selectedCategory;
      updateCategoryPicker();
    }
  });
  el.categoryPicker.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.selectedCategory = button.dataset.category;
    state.categoryMemory[state.selectedType] = state.selectedCategory;
    updateCategoryPicker();
  });
  el.quickNames.addEventListener("click", (event) => {
    const button = event.target.closest("[data-quick-name]");
    if (!button) return;
    el.nameInput.value = button.dataset.quickName;
    state.selectedCategory = button.dataset.quickCategory || classifyTransaction(button.dataset.quickName, state.selectedType);
    state.categoryMemory[state.selectedType] = state.selectedCategory;
    updateCategoryPicker();
    el.amountInput.focus({ preventScroll: true });
  });
  el.dateDisplay.addEventListener("click", openDatePicker);
  el.expenseDate.addEventListener("change", () => {
    if (el.expenseDate.value) setAddDate(el.expenseDate.value);
  });
  el.dateQuick.addEventListener("click", (event) => {
    const button = event.target.closest("[data-date]");
    if (button) setAddDate(button.dataset.date);
  });
  el.addForm.addEventListener("submit", handleAddSubmit);
}

function bindImport() {
  el.importMode.addEventListener("click", (event) => {
    const button = event.target.closest("[data-import-mode]");
    if (button) setImportMode(button.dataset.importMode);
  });
  el.sampleButton.addEventListener("click", loadSampleText);
  el.parseTextButton.addEventListener("click", parseCurrentText);
  if (el.downloadTemplateButton) el.downloadTemplateButton.addEventListener("click", downloadImportTemplate);
  el.fileInput.addEventListener("change", () => {
    const file = el.fileInput.files && el.fileInput.files[0];
    if (file) handleSpreadsheetFile(file);
  });
  ["dragenter", "dragover"].forEach((type) => {
    el.dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      el.dropzone.classList.add("is-dragging");
    });
  });
  ["dragleave", "drop"].forEach((type) => {
    el.dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      el.dropzone.classList.remove("is-dragging");
    });
  });
  el.dropzone.addEventListener("drop", (event) => {
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) handleSpreadsheetFile(file);
  });

  el.imageInput.addEventListener("change", () => {
    const file = el.imageInput.files && el.imageInput.files[0];
    if (file) handleOcrImageFile(file);
  });
  ["dragenter", "dragover"].forEach((type) => {
    el.imageDropzone.addEventListener(type, (event) => {
      event.preventDefault();
      el.imageDropzone.classList.add("is-dragging");
    });
  });
  ["dragleave", "drop"].forEach((type) => {
    el.imageDropzone.addEventListener(type, (event) => {
      event.preventDefault();
      el.imageDropzone.classList.remove("is-dragging");
    });
  });
  el.imageDropzone.addEventListener("drop", (event) => {
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) handleOcrImageFile(file);
  });
  el.recognizeImageButton.addEventListener("click", recognizeBillScreenshot);

  el.billInput.addEventListener("change", () => {
    const file = el.billInput.files && el.billInput.files[0];
    if (file) handleBillFile(file);
  });
  ["dragenter", "dragover"].forEach((type) => {
    el.billDropzone.addEventListener(type, (event) => {
      event.preventDefault();
      el.billDropzone.classList.add("is-dragging");
    });
  });
  ["dragleave", "drop"].forEach((type) => {
    el.billDropzone.addEventListener(type, (event) => {
      event.preventDefault();
      el.billDropzone.classList.remove("is-dragging");
    });
  });
  el.billDropzone.addEventListener("drop", (event) => {
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) handleBillFile(file);
  });
  el.importBillButton.addEventListener("click", importOfficialBill);
  el.importList.addEventListener("input", handleImportListInput);
  el.importList.addEventListener("change", handleImportListChange);
  el.importList.addEventListener("click", (event) => {
    const button = event.target.closest('[data-action="remove-import"]');
    if (!button) return;
    const row = button.closest(".import-row");
    if (row) removeImportItem(row.dataset.id);
  });
  el.selectAllImports.addEventListener("change", () => {
    const checked = el.selectAllImports.checked;
    state.importItems.forEach((item) => { item.selected = checked; });
    $$('[data-field="selected"]', el.importList).forEach((input) => { input.checked = checked; });
    $$(".import-row", el.importList).forEach((row) => row.classList.toggle("is-unselected", !checked));
    updateImportSummary();
  });
  el.confirmImportButton.addEventListener("click", confirmImport);
}

function bindReport() {
  el.rangePresets.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset]");
    if (!button) return;
    const preset = button.dataset.preset;
    if (preset === "custom") {
      state.report.preset = "custom";
      setActivePreset("custom");
      el.rangeStart.focus();
      return;
    }
    applyPreset(preset, true);
  });
  el.generateReportButton.addEventListener("click", generateReport);
  el.reportCategoryType.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category-type]");
    if (!button) return;
    state.report.categoryType = button.dataset.categoryType === "income" ? "income" : "expense";
    renderReport();
  });
  el.reportChartType.addEventListener("click", (event) => {
    const button = event.target.closest("[data-chart-type]");
    if (!button) return;
    state.report.chartType = button.dataset.chartType === "income" ? "income" : "expense";
    renderReport();
  });
  [el.rangeStart, el.rangeEnd].forEach((input) => {
    input.addEventListener("change", () => {
      state.report.preset = "custom";
      setActivePreset("custom");
      el.rangeError.hidden = true;
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        generateReport();
      }
    });
  });
}

function bindRecords() {
  el.recordSearch.addEventListener("input", () => {
    state.filters.search = el.recordSearch.value;
    renderRecords();
  });
  el.recordTypeFilter.addEventListener("change", () => {
    state.filters.type = el.recordTypeFilter.value;
    state.filters.category = "all";
    refreshRecordCategoryFilter();
    renderRecords();
  });
  el.recordCategoryFilter.addEventListener("change", () => {
    state.filters.category = el.recordCategoryFilter.value;
    renderRecords();
  });
  el.recordsList.addEventListener("click", (event) => {
    const row = event.target.closest("[data-record-id]");
    if (row) openRecordDialog(row.dataset.recordId);
  });
}

function bindDialogs() {
  el.closeRecordDialog.addEventListener("click", closeRecordDialog);
  el.editForm.addEventListener("submit", handleEditSubmit);
  el.deleteRecordButton.addEventListener("click", handleDeleteRecord);
  el.editAmount.addEventListener("input", () => {
    el.editAmount.value = sanitizeAmountInput(el.editAmount.value);
  });
  el.editName.addEventListener("input", () => {
    if (el.editName.value.trim()) el.editError.hidden = true;
  });
  el.editType.addEventListener("change", () => {
    const type = el.editType.value === "income" ? "income" : "expense";
    const current = el.editCategory.value;
    const keep = CATEGORY_MAP.has(current) && categoryType(current) === type;
    const selected = keep ? current : classifyTransaction(el.editName.value, type);
    buildEditCategoryOptions(type, selected);
  });
  [el.recordDialog, el.confirmDialog].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", syncModalState);
  });
  el.recordDialog.addEventListener("close", () => {
    state.editingId = null;
  });
}

function bindDataMenu() {
  el.menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleDataMenu();
  });
  el.dataMenu.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    closeDataMenu();
    if (action === "export-backup") exportBackup();
    if (action === "import-backup") el.backupInput.click();
    if (action === "clear-all") await clearAllRecords();
  });
  el.backupInput.addEventListener("change", () => {
    const file = el.backupInput.files && el.backupInput.files[0];
    if (file) handleBackupFile(file);
    el.backupInput.value = "";
  });
  document.addEventListener("click", (event) => {
    if (el.dataMenu.hidden) return;
    if (!event.target.closest(".menu-wrap")) closeDataMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el.dataMenu.hidden) closeDataMenu();
  });
}

function bindStorageSync() {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    state.records = loadRecords();
    renderAll();
    showToast("账本已在另一个页面更新");
  });
}

/* ---------- Boot ---------- */
function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !location.protocol.startsWith("http")) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

function init() {
  cacheElements();
  state.categoryRules = loadCategoryRules();
  state.ocrAliases = loadOcrAliases();
  state.records = loadRecords();
  state.report.start = addDaysISO(todayISO(), -6);
  state.report.end = todayISO();

  setEntryType("expense", { force: true });
  buildRecordCategoryFilter();
  buildEditCategoryOptions("expense");
  setGreeting();
  setAddDate(todayISO());
  syncReportInputs();
  setActivePreset("7d");
  setImportMode("text");

  bindNavigation();
  bindAddForm();
  bindImport();
  bindReport();
  bindRecords();
  bindDialogs();
  bindDataMenu();
  bindStorageSync();

  renderAll();
  setPage("add");
  renderImportPreview();
  registerServiceWorker();
}

window.DongdongLedger = Object.freeze({
  version: APP_VERSION,
  storageKey: STORAGE_KEY,
  parseText: (text) => parseText(text),
  parseSpreadsheetRows: (rows) => parseSpreadsheetRows(rows),
  getRecords: () => state.records.map((record) => ({ ...record }))
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}