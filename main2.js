let cardScore = [0, 10, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10];
let ghost;

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

// 生成二维数组
function make2Array(m, n) {
  let r = new Array(m);
  for (let i = 0;i < m;i++) {
    r[i] = new Array(n);
    r[i].fill(0);
  }
  return r;
}

function calS(x, l, r, rg, u) {
  if (r > 14) {
    return -1;
  }

  let ret = 0, num = 0;
  for (let i = l; i <= r; i++) {
    let j = i == 14 ? 1 : i;
    if (u[x][j]) {
      if (j === ghost) {
        rg--;
      }
      ret += cardScore[j];
      num++;
    }
  }

  if (num + rg == r - l + 1) {
    return ret;
  }
  return -1;
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

function isHun(x) {
  x &= 0xf;
  return x === 0xf || x === ghost;
}

//
function group(handCards) {
  let score = {}, f = {0: 0}, g = {};
  let nowCard = [];
  let out = [];
  let n = handCards.length;
  const SIZE = 1 << n;

  let u = make2Array(4, 13);
  let used = [0, 0, 0, 0];

  let cal = ()=>{
    let num = nowCard.length, ret = -1;
    if (num <= 2) {
      return ret;
    }

    if (num <= 4) {
      let nowNum = 0, ghostNum = 0;
      for (let j = 1; j <= 13; j++) {
        memset(used, 0);
        nowNum = 0, ghostNum = 0;
        for (let i = 0; i < num; i++) {
          let c = nowCard[i] >> 4;
          if ((nowCard[i] & 0xf) == j && used[c] == 0) {
            used[c] = 1;
            nowNum++;
          } else if (isHun(nowCard[i]) ) {
            ghostNum++;
          }
        }
        if (nowNum + ghostNum == num) {
          ret = Math.max(ret, nowNum * cardScore[j]);
        }
      }
    }
    memset(u, 0);
    memset(used, 0xf);
    let realGhost = 0;// 实际的百搭牌
    for (let i = 0; i < num; i++) {
      let v = nowCard[i] & 0xf;
      if (v !== 0xf) {
        let c = nowCard[i] >> 4;
        if (used[c] > v) {
          used[c] = v;
        }
        u[c][v]++;
      } else {
        realGhost++;
      }
    }

    if (ghost !== 0xf) {
      for (let i = 0; i < 4; i++) {
        for (let j = 1; j <= 13; j++) {
          if (u[i][j] && j === ghost) {
            realGhost += u[i][j];
          }
        }
      }
    }

    for (let i = 0; i < 4; i++) {
      for (let l = used[i]; l <= 13; l++) {
        ret = Math.max(ret, calS(i, l, l + num - 1, realGhost, u));
      }
    }
    return ret;
  };// end cal

  // init
  for (let i = 0; i < SIZE; i++) {
    nowCard.splice(0);
    for (let j = 0; j < n; j++) {
      if (i & (1 << j)) {
        nowCard.push(handCards[j]);
      }
    }

    let thisScore = cal();
    if (thisScore > 0) {
      score[i] = thisScore;
    }
  }

  for (let i = 7; i < SIZE; i++) {
    if (count1(i) < 3) {
      continue;
    }
    for (let j = i; j != 0; j = ((j - 1) & i)) {
      if (count1(j) < 3 || score[j] === undefined) {
        continue;
      }
      let k = i ^ j;
      if (f[k] === undefined) {
        continue;
      }
      if ( f[k] + score[j] > (f[i] || 0) ) {
        f[i] = f[k] + score[j];
        g[i] = j;
      }
    }
  }

  let maxScore = 0, endState = 0;
  for (let i = 0; i < SIZE; i++) {
    if (!f[i]) {
      continue;
    }
    if (f[i] > maxScore) {
      maxScore = f[i];
      endState = i;
    } else if (f[i] == maxScore && count1(i) > count1(endState) ) {
      maxScore = f[i];
      endState = i;
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

  // push 杂牌
  if (f[0] !== n ) {
    let o = [];
    for (let i = 0; i < n; i++) {
      if ( u2[i] !== -1 ) {
        o.push(handCards[i]);
      }
    }
    out.push(o.splice(0, 4));
    for (let i = 1;o.length; i++) {
      out.push(o.splice(0, 3));
    }
  }
  display(out);
  console.log(maxScore);
  return maxScore;
}

function display(group) {
  let s = group.map(g => {
    return g.map(c=>{
      let x = c.toString(16);
      if (x.length == 1) {
        x = '0' + x;
      }
      return `0x${x}`;
    });
  }).join(' | ');
  console.log(s);
}

function main() {
  let handCards = [
    [0x1, 0x1, 0x4f, 0x2, 0x2, 0x4f, 0x3, 0x4, 0xb, 0xc, 0xd, 0x14, 0x24],
  ];
  console.time();
  for (let i = 0;i < handCards.length;i++) {
    ghost = 0xf;
    group(handCards[i]);
  }
  console.timeEnd();
  return 0;
}

main();
