import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, ROUTES } from '../../utils/constants';
import Ionicons from 'react-native-vector-icons/Ionicons';

/**
 * 訊息類型定義
 */
type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

/**
 * 遊戲資訊類型定義
 */
type GameInfo = {
  id: string;
  title: string;
  icon: string;
  rating: number;
  backgroundColor: string;
};

/**
 * 推薦標籤類型
 */
type SuggestionTag = {
  id: string;
  text: string;
};

/**
 * AI助手頁面
 */
const AIAssistantScreen: React.FC = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // 訊息資料
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '嗨，我是您的AI老虎機助手！我可以幫您分析遊戲趨勢、提供遊戲策略建議，以及根據您的遊戲風格推薦最適合的遊戲。有什麼我可以幫助您的嗎？',
      sender: 'ai',
      timestamp: new Date(Date.now() - 5 * 60000) // 5分鐘前
    }
  ]);
  
  // 輸入文字
  const [inputText, setInputText] = useState('');
  
  // 快速建議標籤
  const suggestionTags: SuggestionTag[] = [
    { id: '1', text: '遊戲推薦' },
    { id: '2', text: '贏率分析' },
    { id: '3', text: '遊戲規則' }
  ];

  const navigateBack = () => {
    navigation.goBack();
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;
    
    // 添加用戶訊息
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    // 模擬AI回應
    setTimeout(() => {
      let aiResponse: Message;
      
      // 根據用戶輸入提供不同回應
      if (inputText.includes('推薦') || inputText.includes('適合')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          text: '根據您的遊戲記錄和偏好分析，我發現您偏好中等風險的遊戲，並且更喜歡有特殊功能的遊戲。以下是我為您推薦的遊戲：\n\n1. 幸運七 - 匹配度：85%\n2. 翡翠寶石 - 匹配度：78%\n3. 金幣樂園 - 匹配度：75%\n\n要了解更多關於這些遊戲的詳情嗎？',
          sender: 'ai',
          timestamp: new Date()
        };
      } else if (inputText.includes('幸運七')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          text: '幸運七是我們平台上最受歡迎的遊戲之一。這是一個傳統風格的老虎機遊戲，帶有現代特色：\n\n• 5條支付線\n• 中等波動率\n• RTP (返還率)：96.5%\n• 特色：免費旋轉、乘數和獎金遊戲\n\n根據您的遊戲風格，我建議您以中等投注額開始，並關注特殊符號的出現。特別是當您獲得免費旋轉時，您可以獲得更高的獎金。',
          sender: 'ai',
          timestamp: new Date()
        };
      } else if (inputText.includes('贏率') || inputText.includes('機率') || inputText.includes('概率')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          text: '老虎機遊戲的贏率主要由RTP(返還率)決定。我們平台上的遊戲RTP範圍在94%-98%之間。\n\n目前您的數據顯示，您在「幸運七」遊戲中的個人贏率為35%，高於平台平均值的32%。\n\n如果您想提高贏率，建議：\n1. 選擇高RTP的遊戲\n2. 設定停損和停利點\n3. 利用遊戲中的特殊功能和獎金回合',
          sender: 'ai',
          timestamp: new Date()
        };
      } else {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          text: '感謝您的提問。您想了解更多關於特定遊戲的資訊，還是需要關於策略、贏率或其他方面的建議？我可以為您提供個性化的遊戲推薦，或者解答您關於老虎機遊戲的任何疑問。',
          sender: 'ai',
          timestamp: new Date()
        };
      }
      
      setMessages(prev => [...prev, aiResponse]);
      
      // 自動滾動到底部
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    }, 1000); // 1秒後回應
    
    // 自動滾動到底部
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const useSuggestion = (text: string) => {
    setInputText(text);
  };

  // 格式化時間
  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && 
                    date.getMonth() === today.getMonth() && 
                    date.getFullYear() === today.getFullYear();
    
    if (isToday) {
      return '今天';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() && 
                         date.getMonth() === yesterday.getMonth() && 
                         date.getFullYear() === yesterday.getFullYear();
    
    if (isYesterday) {
      return '昨天';
    }
    
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 判斷是否需要顯示日期分隔器
  const shouldShowDateSeparator = (index: number) => {
    if (index === 0) return true;
    
    const currentMessage = messages[index];
    const previousMessage = messages[index - 1];
    
    const currentDate = new Date(currentMessage.timestamp);
    const previousDate = new Date(previousMessage.timestamp);
    
    return currentDate.getDate() !== previousDate.getDate() || 
           currentDate.getMonth() !== previousDate.getMonth() || 
           currentDate.getFullYear() !== previousDate.getFullYear();
  };

  // 渲染遊戲卡片
  const renderGameCard = (game: GameInfo) => {
    return (
      <View style={styles.gameCardContainer}>
        <View style={styles.gameCardHeader}>
          <View style={[styles.gameIcon, { backgroundColor: game.backgroundColor }]}>
            <Ionicons name={game.icon} size={20} color="white" />
          </View>
          <View>
            <Text style={styles.gameTitle}>{game.title}</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons 
                  key={star}
                  name={star <= game.rating ? "star" : star <= game.rating + 0.5 ? "star-half" : "star-outline"} 
                  size={12} 
                  color={COLORS.accent} 
                  style={{ marginRight: 2 }}
                />
              ))}
              <Text style={styles.ratingText}>({game.rating})</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.playButton}>
          <Text style={styles.playButtonText}>立即遊戲</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI 老虎機助手</Text>
      </View>
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message, index) => (
          <React.Fragment key={message.id}>
            {shouldShowDateSeparator(index) && (
              <View style={styles.dateSeparator}>
                <Text style={styles.dateSeparatorText}>
                  {formatDate(message.timestamp)} {formatTime(message.timestamp)}
                </Text>
              </View>
            )}
            
            <View style={[
              styles.messageRow, 
              message.sender === 'user' ? styles.userMessageRow : styles.aiMessageRow
            ]}>
              {message.sender === 'ai' && (
                <View style={styles.avatarContainer}>
                  <Ionicons name="logo-electron" size={20} color="white" />
                </View>
              )}
              
              <View style={[
                styles.messageBubble, 
                message.sender === 'user' ? styles.userBubble : styles.aiBubble
              ]}>
                <Text style={[
                  styles.messageText, 
                  message.sender === 'user' ? styles.userMessageText : styles.aiMessageText
                ]}>
                  {message.text}
                </Text>
                
                {message.text.includes('幸運七是我們平台上最受歡迎的遊戲之一') && (
                  renderGameCard({
                    id: '1',
                    title: '幸運七',
                    icon: 'diamond',
                    rating: 4.5,
                    backgroundColor: COLORS.primary
                  })
                )}
              </View>
            </View>
          </React.Fragment>
        ))}
      </ScrollView>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="輸入問題..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="paper-plane" size={20} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.suggestionsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsContent}
        >
          {suggestionTags.map((tag) => (
            <TouchableOpacity 
              key={tag.id} 
              style={styles.suggestionTag}
              onPress={() => useSuggestion(tag.text)}
            >
              <Text style={styles.suggestionText}>{tag.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: '#999',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  aiMessageRow: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '75%',
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: 'white',
  },
  aiMessageText: {
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  suggestionsContainer: {
    padding: 8,
    backgroundColor: 'white',
  },
  suggestionsContent: {
    paddingVertical: 4,
  },
  suggestionTag: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 13,
    color: '#333',
  },
  gameCardContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  gameCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  gameIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  gameTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.accent,
    marginLeft: 2,
  },
  playButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  playButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default AIAssistantScreen; 