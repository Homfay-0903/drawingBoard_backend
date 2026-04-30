export const wordBank = {
  animals: [
    '猫', '狗', '兔子', '老虎', '狮子', '大象', '长颈鹿',
    '熊猫', '企鹅', '海豚', '蝴蝶', '蜜蜂', '蜗牛', '青蛙',
    '乌龟', '蛇', '鳄鱼', '鲨鱼', '鲸鱼', '章鱼'
  ],
  food: [
    '苹果', '香蕉', '西瓜', '葡萄', '草莓', '橙子', '桃子',
    '蛋糕', '冰淇淋', '汉堡', '披萨', '面条', '饺子', '包子',
    '米饭', '鸡蛋', '牛奶', '咖啡', '果汁', '可乐'
  ],
  objects: [
    '手机', '电脑', '电视', '冰箱', '空调', '风扇', '灯泡',
    '书本', '铅笔', '橡皮', '剪刀', '尺子', '眼镜', '手表',
    '钥匙', '雨伞', '帽子', '鞋子', '背包', '钱包'
  ],
  sports: [
    '足球', '篮球', '乒乓球', '羽毛球', '网球', '排球', '棒球',
    '游泳', '跑步', '跳绳', '滑冰', '滑雪', '骑自行车', '瑜伽',
    '拳击', '射箭', '举重', '跳水', '冲浪', '攀岩'
  ],
  jobs: [
    '医生', '老师', '警察', '消防员', '厨师', '司机', '农民',
    '画家', '歌手', '演员', '运动员', '科学家', '工程师', '程序员',
    '护士', '律师', '记者', '摄影师', '设计师', '飞行员'
  ],
  nature: [
    '太阳', '月亮', '星星', '云', '雨', '雪', '彩虹',
    '山', '河', '湖', '海', '瀑布', '沙漠', '森林',
    '花', '树', '草', '叶子', '石头', '火山'
  ]
}

export class WordService {
  private words: string[]
  private usedWords: Set<string>

  constructor() {
    this.words = this.loadWords()
    this.usedWords = new Set()
  }

  private loadWords(): string[] {
    return Object.values(wordBank).flat()
  }

  getRandomWords(count: number = 3): string[] {
    const availableWords = this.words.filter(w => !this.usedWords.has(w))
    
    if (availableWords.length < count) {
      this.usedWords.clear()
      return this.getRandomWords(count)
    }

    const selected: string[] = []
    const shuffled = [...availableWords].sort(() => Math.random() - 0.5)
    
    for (let i = 0; i < count && i < shuffled.length; i++) {
      selected.push(shuffled[i])
      this.usedWords.add(shuffled[i])
    }

    return selected
  }

  generateHints(word: string): string[] {
    const hints: string[] = []
    const chars = word.split('')
    
    hints.push(chars[0])
    
    for (let i = 1; i < chars.length - 1; i++) {
      hints.push('_')
    }
    
    if (chars.length > 2) {
      hints.push(chars[chars.length - 1])
    } else if (chars.length === 2) {
      hints.push('_')
    }
    
    return hints
  }

  resetUsedWords(): void {
    this.usedWords.clear()
  }
}

export const wordService = new WordService()
