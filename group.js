let cardScore = [0, 10, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 0, 0];

const Poker = [
  0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, // 方块 1 - k
  // 1,2,3,4,5,6,7,8,9,10,11,12,13
  0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, // 梅花 1 - k
  // 17 18 19 20 21 22 23 24 25 26 27 28 29
  0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D, // 红桃 1 - k
  // 33 34 35 36 37 38 39 40 41 42 43 44 45
  0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, // 黑桃 1 - k
  // 49 50 51 52 53 54 55 56 57 58 59 60 51
  0x4F, 0x4F
  // 79 79 大小王一致
];

const best = {
  0x010000: 0x000100,
  0x020000: 0x000200,
  0x030000: 0x000200,
  0x040000: 0x000200,
  0x100000: 0x001000,
  0x200000: 0x002000,
  0x300000: 0x002000,
  0x400000: 0x002000,
  0x110000: 0x002000,
  0x120000: 0x002000,
  0x130000: 0x002000,
  0x210000: 0x002000,
  0x220000: 0x002000,
  0x310000: 0x002000,
};

// 生成二维数组
function make2Array(m, n) {
  let r = new Array(m);
  for (let i = 0;i < m;i++) {
    r[i] = new Array(n);
    r[i].fill(0);
  }
  return r;
}

function memset(d, v) {
  for (let i = 0, j = d.length;i < j;i++) {
    if (Array.isArray(d[0])) {
      memset(d[i], v);
    } else {
      d[i] = v;
    }
  }
}

// 计算1的个数
function count1(x) {
  let ret = 0;
  while (x) {
    x ^= x & (-x);
    ret++;
  }
  return ret;
}

function group({handCards, ghost}) {
  ghost &= 0xf;
  let score = {}, f = {0: 0}, g = {};
  let nowCard = new Array(13);
  let out = [];
  let n = handCards.length;
  const SIZE = 1 << n;

  let maxScore = 0, minScore = 0, endState = 0, isChun = false;

  handCards.sort((a, b)=>a - b);
  let u = make2Array(4, 14);
  let used = [0, 0, 0, 0];
  let cardScoreTpl = cardScore.slice(0);
  cardScoreTpl[ghost] = 0;// 王与joker为0分

  function getScore(cards) {
    let sum = 0;
    for (let i = 0, j = cards.length;i < j;i++) {
      sum += cardScoreTpl[cards[i] & 0xf];
    }
    return sum;
  }

  function calS(x, l, r, rg) {
    if (r > 14) {
      return -1;
    }

    let num = 0, ret = 0;
    for (let i = l; i <= r; i++) {
      let j = i == 14 ? 1 : i;
      if (u[x][j]) {
        if (j === ghost) {
          rg--;
        }
        num++;
        ret += cardScore[j];
      }
    }

    if (num + rg == r - l + 1) {
      let type = rg === 0 ? 0x100000 : 0x010000;
      return type | ret;
      // return ret;
    }
    return -1;
  }

  // 对一小撮牌初步分析，看是Set还是顺子
  let cal = (num)=>{
    let ret = -1;

    memset(u, 0);
    memset(used, 0);

    let king = 0;
    let rg = 0;
    let isCanSet = true, isCanRun = true;
    let beginColor = -1, beginValue = -1;
    for (let i = 0; i < num; i++) {
      let v = nowCard[i] & 0xf;// 牌值
      if (v !== 0xf) { // 非王
        let c = nowCard[i] >> 4;// 花色
        if (used[c]) { // 这个颜色已经使用
          isCanSet = false;
        }
        if (beginColor === -1) {
          beginColor = c;
          beginValue = v;
        }
        if (v !== ghost) {
          // 有重复的牌
          if (u[c][v] === 1) {
            return ret;
          }

          // 颜色不同说明不是顺子
          if (beginColor != c) {
            isCanRun = false;
          }

          // 牌值不一样，一定不是Set
          if (beginValue != v) {
            isCanSet = false;
          }
        } else {
          rg++;
        }
        u[c][v]++;
        used[c]++;
      } else {
        king++;
      }
    }// end for

    // 全部是王，是无效组合
    if (num === king) {
      return ret;
    }

    let realGhost = king + rg;
    // Set
    if (num <= 4 && isCanSet) {
      let real = num - realGhost;// 真实的牌
      return real * cardScore[beginValue];
    }

    // Run
    if (isCanRun) {
      ret = calS(beginColor, beginValue, beginValue + num - 1, realGhost);

      if (beginValue === 1) {
        let secondValue = -1;
        for (let i = 2;i < 13;i++) {
          if (u[beginColor][i]) {
            secondValue = i;
            break;
          }
        }
        if (secondValue > 0) {
          ret = Math.max(ret, calS(beginColor, secondValue, secondValue + num - 1, realGhost));
        }
      }
      return ret;
    }// end if Run

    return ret;
  };// end cal

  // init
  for (let i = 7, k = 0; i < SIZE; i++) {
    if (count1(i) < 3) {
      continue;
    }
    k = 0;
    for (let j = 0, l = i; j < n && l; j++, l >>= 1) {
      if (l & 1) {
        nowCard[k++] = handCards[j];
      }
    }

    let s = cal(k);
    if (s > 0) {
      score[i] = s;
    }
  }

  // 查找最好的结果
  for (let i = 7; i < SIZE; i++) {
    for (let j = i; j != 0; j = ((j - 1) & i)) {
      if (score[j] === undefined) {
        continue;
      }
      let k = i ^ j;
      if (f[k] === undefined) {
        continue;
      }

      let sum = f[k] + score[j];
      let sumType = sum & 0xff0000;
      let tmpScore = best[sumType] | (sum & 0xff);
      if ( tmpScore > (f[i] & 0x00ffff) ) {
        f[i] = sumType | tmpScore;
        g[i] = j;

        if (tmpScore > maxScore) {
          maxScore = tmpScore;
          endState = i;
          isChun =  maxScore > 0x2000;
        } else if (tmpScore == maxScore && count1(i) > count1(endState) ) {
          maxScore = tmpScore;
          endState = i;
          isChun =  maxScore > 0x2000;
        }
      }
    }
  }

  let u2 = u[0];
  // 取结果
  while (endState) {
    let x = g[endState];
    let o = [];
    for (let i = 0; i < n; i++) {
      if ((1 << i) & x) {
        u2[i] = -1;
        o.push(handCards[i]);
      }
    }
    f[0] += o.length;
    out.push(o);
    endState ^= g[endState];
  }

  // 没有纯顺子的情况下，任何组合都无效
  if (!isChun) {
    out.forEach(g=>{
      minScore += getScore(g);
    });
  }

  // push 杂牌
  if (f[0] !== n ) {
    let o = [];
    for (let i = 0; i < n; i++) {
      if ( u2[i] !== -1 ) {
        minScore += cardScoreTpl[handCards[i] & 0xf];
        o.push(handCards[i]);
      }
    }
    minScore = Math.min(80, minScore);
    out.push(o.splice(0, 4));
    for (let i = 1;o.length; i++) {
      out.push(o.splice(0, 3));
    }
  }

  console.log('raw handCards:', displayHand(handCards).join(', '));
  display(out);
  console.log('minScore: ', minScore);
  // console.log('maxScore: 0x0', maxScore.toString(16));
  return {out, minScore};
}

function displayHand(g) {
  return g.map(c=>{
    let x = c.toString(16);
    if (x.length == 1) {
      x = '0' + x;
    }
    return `0x${x}`;
  });
}

function display(group) {
  let s = group.map(g => {
    return displayHand(g);
  }).join(' | ');
  console.log(s);
}

function main() {
  let data = [
    {
      handCards: [0x02, 0x12, 0x22, 0x03, 0x13, 0x23, 0x04, 0x14, 0x24, 0x01, 0x0c, 0x0d],
      ghost: 0x5
    },
    {
      handCards: [0x02, 0x28, 0x17, 0x27, 0x1a, 0x07, 0x3d, 0x3c, 0x35, 0x25, 0x29, 0x4f, 0x31],
      ghost: 0x1A
    },
    {
      handCards: [0x2, 0x3, 0x4, 0x3, 0x4, 0x4f, 0x6, 0x14, 0x24, 0x32, 0x12, 0x13, 0x14],
      ghost: 0xf
    },
    {
      handCards: [0x01, 0x02, 0x03, 0x06, 0x14, 0x34, 0x11, 0x12, 0x13, 0x21, 0x22, 0x23],
      ghost: 0x6
    },
    {
      handCards: [0x19, 0x1a, 0x1b, 0x4f, 0x16, 0x1b, 0x14, 0x17, 0x34, 0x32, 0x33, 0x15, 0x18],
      ghost: 0xb
    },
    {
      handCards: [0x28, 0x26, 0x27, 0x18, 0x2B, 0x2C, 0x2D, 0x08, 0x0d, 0x37, 0x39, 0x09, 0x13],
      ghost: 0x0d
    },
    {
      handCards: [0x1a, 0x1b, 0x1a],
      ghost: 0x0a
    }
  ];

  console.time();
  group(data[5]);
  console.timeEnd();
  return 0;
}

main();
