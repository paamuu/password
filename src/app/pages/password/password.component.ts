import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './password.component.html',
})
export class PasswordComponent implements OnDestroy {
  domain: string = '';
  masterPassword: string = '';
  rows: number = 4;
  cols: number = 4;
  requiredNumbers: number = 4;
  requiredLetters: number = 4;
  requiredSymbols: number = 4;
  numberMatrix: number[] = [];
  letterMatrix: string[] = [];
  symbolMatrix: string[] = [];
  selectedNumberIndices: number[] = [];
  selectedLetterIndices: number[] = [];
  selectedSymbolIndices: number[] = [];
  generatedPassword: string = '';
  isCopied: boolean = false;
  countdown: number = 10;

  private readonly NUMBERS = '0123456789';
  private readonly LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private readonly SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  private copyTimeout: any;
  private countdownInterval: any;

  generateMatrices() {
    if (!this.domain || !this.masterPassword) {
      alert('请输入域名和主密码');
      return;
    }

    if (!this.rows || !this.cols || this.rows < 1 || this.cols < 1) {
      alert('请输入有效的矩阵大小');
      return;
    }

    if (!this.requiredNumbers || !this.requiredLetters || !this.requiredSymbols || 
        this.requiredNumbers < 1 || this.requiredLetters < 1 || this.requiredSymbols < 1) {
      alert('请输入有效的必选元素数量');
      return;
    }

    const matrixSize = this.rows * this.cols;

    // 使用域名和主密码生成种子
    const seed = CryptoJS.SHA256(this.domain + this.masterPassword).toString();
    
    // 生成数字矩阵
    this.numberMatrix = this.generateMatrixWithDuplicates(seed + 'numbers', this.NUMBERS, matrixSize)
      .map(char => parseInt(char));
    
    // 生成字母矩阵
    this.letterMatrix = this.generateMatrixWithDuplicates(seed + 'letters', this.LETTERS, matrixSize);
    
    // 生成符号矩阵
    this.symbolMatrix = this.generateMatrixWithDuplicates(seed + 'symbols', this.SYMBOLS, matrixSize);

    // 重置选择状态
    this.selectedNumberIndices = [];
    this.selectedLetterIndices = [];
    this.selectedSymbolIndices = [];
    this.generatedPassword = '';
  }

  private generateMatrixWithDuplicates(seed: string, charset: string, size: number): string[] {
    const matrix: string[] = [];
    const chars = charset.split('');
    
    // 使用种子生成随机数
    const random = this.seededRandom(seed);
    
    // 确保生成的矩阵包含足够的随机性
    for (let i = 0; i < size; i++) {
      // 使用多个随机数来增加随机性
      const randomValue = random();
      const index = Math.floor(randomValue * chars.length);
      matrix.push(chars[index]);
    }
    
    return matrix;
  }

  private seededRandom(seed: string): () => number {
    // 使用更复杂的哈希算法来生成随机数
    let hash = CryptoJS.SHA256(seed).toString();
    let value = 0;
    
    // 将哈希值转换为数字
    for (let i = 0; i < hash.length; i += 2) {
      value = (value * 256 + parseInt(hash.substr(i, 2), 16)) % 2147483647;
    }
    
    return function() {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  }

  toggleNumberSelection(index: number) {
    const position = this.selectedNumberIndices.indexOf(index);
    if (position === -1) {
      if (this.selectedNumberIndices.length < this.requiredNumbers) {
        this.selectedNumberIndices.push(index);
      }
    } else {
      this.selectedNumberIndices.splice(position, 1);
    }
  }

  toggleLetterSelection(index: number) {
    const position = this.selectedLetterIndices.indexOf(index);
    if (position === -1) {
      if (this.selectedLetterIndices.length < this.requiredLetters) {
        this.selectedLetterIndices.push(index);
      }
    } else {
      this.selectedLetterIndices.splice(position, 1);
    }
  }

  toggleSymbolSelection(index: number) {
    const position = this.selectedSymbolIndices.indexOf(index);
    if (position === -1) {
      if (this.selectedSymbolIndices.length < this.requiredSymbols) {
        this.selectedSymbolIndices.push(index);
      }
    } else {
      this.selectedSymbolIndices.splice(position, 1);
    }
  }

  generatePassword() {
    if (this.selectedNumberIndices.length === this.requiredNumbers && 
        this.selectedLetterIndices.length === this.requiredLetters && 
        this.selectedSymbolIndices.length === this.requiredSymbols) {
      
      // 获取选中的元素并排序，确保相同选择产生相同结果
      const selectedNumbers = this.selectedNumberIndices
        .sort((a, b) => a - b)
        .map(i => this.numberMatrix[i].toString());
      
      const selectedLetters = this.selectedLetterIndices
        .sort((a, b) => a - b)
        .map(i => this.letterMatrix[i]);
      
      const selectedSymbols = this.selectedSymbolIndices
        .sort((a, b) => a - b)
        .map(i => this.symbolMatrix[i]);
      
      // 计算最大长度
      const maxLength = Math.max(
        selectedNumbers.length,
        selectedLetters.length,
        selectedSymbols.length
      );
      
      // 交错排列
      const passwordParts: string[] = [];
      for (let i = 0; i < maxLength; i++) {
        if (i < selectedNumbers.length) {
          passwordParts.push(selectedNumbers[i]);
        }
        if (i < selectedLetters.length) {
          passwordParts.push(selectedLetters[i]);
        }
        if (i < selectedSymbols.length) {
          passwordParts.push(selectedSymbols[i]);
        }
      }
      
      this.generatedPassword = passwordParts.join('');
    } else {
      alert(`请从数字矩阵中选择${this.requiredNumbers}个元素，从字母矩阵中选择${this.requiredLetters}个元素，从符号矩阵中选择${this.requiredSymbols}个元素`);
      this.generatedPassword = '';
    }
  }

  async copyPassword() {
    if (!this.generatedPassword) return;
    
    try {
      await navigator.clipboard.writeText(this.generatedPassword);
      this.isCopied = true;
      this.countdown = 10;
      
      // 清除之前的定时器
      if (this.copyTimeout) {
        clearTimeout(this.copyTimeout);
      }
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
      
      // 开始倒计时
      this.countdownInterval = setInterval(() => {
        this.countdown--;
        if (this.countdown <= 0) {
          clearInterval(this.countdownInterval);
        }
      }, 1000);
      
      // 10秒后清除剪贴板
      this.copyTimeout = setTimeout(async () => {
        try {
          await navigator.clipboard.writeText('');
          this.isCopied = false;
          this.countdown = 10;
          clearInterval(this.countdownInterval);
        } catch (error) {
          console.error('清除剪贴板失败:', error);
        }
      }, 10000);
    } catch (error) {
      console.error('复制密码失败:', error);
      alert('复制密码失败，请手动复制');
    }
  }

  ngOnDestroy() {
    // 组件销毁时清除定时器
    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout);
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
