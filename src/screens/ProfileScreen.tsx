const ConnectionsCard = ({ userId }: { userId: string }) => {
    const navigation = useNavigation(); 
    const { t } = useTranslation();
    const { user: loggedInUser } = useAuth();
    
    const [activeTab, setActiveTab] = React.useState<'following' | 'followers'>('following');
    
    const { data: followers } = useGetFollowers(userId);
    const { data: following } = useGetFollowing(userId);
    
    const list = activeTab === 'followers' ? followers : following;
    
    const countFollowers = followers?.length || 0;
    const countFollowing = following?.length || 0;
    
    const { mutate: follow } = useFollowUser();
    const { mutate: unfollow } = useUnfollowUser();

    const handleFollowToggle = (targetId: string, isAlreadyFollowing: boolean) => { 
        if (isAlreadyFollowing) unfollow(targetId); 
        else follow(targetId); 
    };

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('orbit_connections')}</Text>
            <View style={styles.tabsRow}>
                <TouchableOpacity style={[styles.tabItem, activeTab === 'following' && styles.activeTab]} onPress={() => setActiveTab('following')}><Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>{t('following')} ({countFollowing})</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.tabItem, activeTab === 'followers' && styles.activeTab]} onPress={() => setActiveTab('followers')}><Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>{t('followers')} ({countFollowers})</Text></TouchableOpacity>
            </View>
            <View style={{ height: (list && list.length > 3) ? MAX_CONNECTIONS_HEIGHT : 'auto' }}>
                <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                    <View style={styles.grid}>
                        {list && list.length > 0 ? list.map((u: any) => {
                            const isMe = loggedInUser?.id === u.id;
                            
                            // CORREÇÃO: Usa o dado direto do backend se disponível, ou fallback para a lista antiga
                            const amIFollowing = u.isFollowedByMe ?? false;

                            return (
                                <View key={u.id} style={styles.connectionItemWrapper}>
                                    <TouchableOpacity style={styles.connectionItem} onPress={() => (navigation as any).push('PublicProfile', { userId: u.id })}>
                                        <Image source={{ uri: u.profile?.imageUrl || 'https://via.placeholder.com/150' }} style={styles.connectionAvatar} />
                                        <Text style={styles.connectionName} numberOfLines={1}>{u.name ? u.name.split(' ')[0] : t('user_default')}</Text>
                                    </TouchableOpacity>
                                    {!isMe && (
                                        <TouchableOpacity 
                                            style={[styles.followMiniBtn, amIFollowing && styles.followingMiniBtn]} 
                                            onPress={() => handleFollowToggle(u.id, !!amIFollowing)} 
                                            activeOpacity={0.8}
                                        >
                                            {amIFollowing ? <Check size={10} color="#FFF" strokeWidth={4} /> : <Plus size={10} color="#FFF" strokeWidth={4} />}
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        }) : <Text style={styles.emptyText}>{t('nobody_here')}</Text>}
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};