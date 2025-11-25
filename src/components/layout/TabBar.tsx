import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Sparkles, Home, MessageCircle, User, Plus } from 'lucide-react-native';

// Agora os hooks existem e funcionam!
import { useGetUnreadLikesCount, useGetUnreadMessageCount } from '../../hooks/useBadges';

export const TabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  
  // Contagem de Likes
  const { data: unreadLikesData } = useGetUnreadLikesCount();
  const likesCount = unreadLikesData?.count || 0;

  // Contagem de Mensagens
  const { data: unreadMessagesData } = useGetUnreadMessageCount();
  const messagesCount = unreadMessagesData?.count || 0;

  // Soma Total
  const totalUnreadCount = likesCount + messagesCount;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Botão Central (+)
          if (route.name === 'PostCreation') {
            return (
              <TouchableOpacity
                key={index}
                onPress={onPress}
                style={styles.plusButtonContainer}
                activeOpacity={0.8}
              >
                <View style={styles.plusButton}>
                  <Plus size={28} color="#FFF" strokeWidth={3} />
                </View>
              </TouchableOpacity>
            );
          }

          let IconComponent;
          let label = '';

          switch (route.name) {
            case 'DiscoveryTab':
              IconComponent = Sparkles;
              label = 'Descoberta';
              break;
            case 'FeedTab':
              IconComponent = Home;
              label = 'Feed';
              break;
            case 'ChatTab':
              IconComponent = MessageCircle;
              label = 'Chat';
              break;
            case 'ProfileTab':
              IconComponent = User;
              label = 'Perfil';
              break;
            default:
              IconComponent = Home;
          }

          const color = isFocused ? '#A78BFA' : '#9CA3AF'; 

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <IconComponent 
                  size={26} 
                  color={color} 
                  fill={isFocused ? color : 'transparent'} 
                  strokeWidth={isFocused ? 2.5 : 2}
                />
                
                {/* BADGE DE NOTIFICAÇÃO NO CHAT */}
                {route.name === 'ChatTab' && totalUnreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                    </Text>
                  </View>
                )}
              </View>
              
              <Text style={[styles.label, { color }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827', 
    borderTopWidth: 1,
    borderTopColor: '#374151', 
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, 
  },
  content: {
    flexDirection: 'row',
    height: 64, 
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  label: {
    fontSize: 10, 
    fontWeight: '500',
  },
  plusButtonContainer: {
    top: -20, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusButton: {
    width: 56, 
    height: 56,
    borderRadius: 28, 
    backgroundColor: '#8B5CF6', 
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 4,
    borderColor: '#111827', 
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#9333EA', 
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#111827',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  }
});