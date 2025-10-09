import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { fetchCommunity } from '../../services/admin';
import { CommunityData, ModerationComment, ReportedComment, CommunityPost } from '../../types';
import AdminLayout from '../../components/AdminLayout';

export default function AdminCommunity() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CommunityData | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchCommunity();
      setData(res);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const moderationComments = useMemo<ModerationComment[]>(() => data?.moderationComments || [], [data]);
  const reportedComments = useMemo<ReportedComment[]>(() => data?.reportedComments || [], [data]);
  const communityPosts = useMemo<CommunityPost[]>(() => data?.communityPosts || [], [data]);

  return (
    <AdminLayout title="Community" subtitle="Moderation & Engagement">
      <Stack.Screen options={{ headerShown: false }} />

        {loading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading community…</Text>
          </View>
        ) : error ? (
          <View style={styles.centerWrap}>
            <MaterialIcons name="error-outline" size={32} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Comment Moderation */}
            <SectionHeader key="community-comment-moderation" title="Comment Moderation" />
            <View style={styles.card}>
              {moderationComments.slice(0, 3).map((comment) => (
                <ModerationCommentItem key={comment._id} comment={comment} />
              ))}
              {moderationComments.length > 3 && (
                <TouchableOpacity style={styles.showMoreBtn}>
                  <Text style={styles.showMoreText}>Show {moderationComments.length - 3} More</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Reported Comments */}
            <SectionHeader key="community-reported-comments" title="Reported Comments" />
            <View style={styles.card}>
              {reportedComments.map((comment) => (
                <ReportedCommentItem key={comment._id} comment={comment} />
              ))}
            </View>

            {/* Community Posts */}
            <SectionHeader key="community-posts-section" title="Community Posts" />
            <View style={styles.card}>
              {communityPosts.map((post) => (
                <CommunityPostItem key={post._id} post={post} />
              ))}
            </View>
          </ScrollView>
        )}
    </AdminLayout>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.dot} />
    </View>
  );
}

function ModerationCommentItem({ comment }: { comment: ModerationComment }) {
  return (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>{comment.author.name}</Text>
        <Text style={styles.commentTime}>{new Date(comment.createdAt).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.commentText}>{comment.text}</Text>
      <Text style={styles.commentVideo}>on "{comment.video.title}"</Text>
      <View style={styles.moderationActions}>
        <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]}>
          <Text style={styles.actionBtnText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]}>
          <Text style={styles.actionBtnText}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.pinBtn]}>
          <Text style={styles.actionBtnText}>Pin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ReportedCommentItem({ comment }: { comment: ReportedComment }) {
  return (
    <View style={styles.reportedItem}>
      <View style={styles.reportedHeader}>
        <MaterialIcons name="flag" size={16} color={colors.error} />
        <Text style={styles.reportedAuthor}>{comment.author.name}</Text>
        <Text style={styles.reportedReason}>{comment.reason}</Text>
      </View>
      <Text style={styles.reportedText}>{comment.text}</Text>
      <View style={styles.reportedActions}>
        <TouchableOpacity style={styles.spamBtn}>
          <Text style={styles.spamBtnText}>Spam</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CommunityPostItem({ post }: { post: CommunityPost }) {
  return (
    <View style={styles.postItem}>
      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postContent}>{post.content}</Text>
      <Text style={styles.postMeta}>
        by {post.author.name} • {new Date(post.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 8 },
  sectionTitle: { color: colors.text.primary, fontSize: 16, fontWeight: '700' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  card: { backgroundColor: colors.background.secondary, borderRadius: 12, padding: 12, marginBottom: 12 },
  commentItem: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  commentAuthor: { color: colors.text.primary, fontWeight: '700', fontSize: 14 },
  commentTime: { color: colors.text.secondary, fontSize: 12 },
  commentText: { color: colors.text.primary, fontSize: 14, marginBottom: 4 },
  commentVideo: { color: colors.text.secondary, fontSize: 12, fontStyle: 'italic', marginBottom: 8 },
  moderationActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  approveBtn: { backgroundColor: 'rgba(76, 175, 80, 0.2)' },
  deleteBtn: { backgroundColor: 'rgba(244, 67, 54, 0.2)' },
  pinBtn: { backgroundColor: 'rgba(255, 193, 7, 0.2)' },
  actionBtnText: { color: colors.text.primary, fontSize: 12, fontWeight: '700' },
  reportedItem: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' },
  reportedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  reportedAuthor: { color: colors.text.primary, fontWeight: '700', fontSize: 14 },
  reportedReason: { color: colors.error, fontSize: 12, fontWeight: '600' },
  reportedText: { color: colors.text.primary, fontSize: 14, marginBottom: 8 },
  reportedActions: { flexDirection: 'row' },
  spamBtn: { backgroundColor: 'rgba(244, 67, 54, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  spamBtnText: { color: colors.error, fontSize: 12, fontWeight: '700' },
  postItem: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' },
  postTitle: { color: colors.text.primary, fontWeight: '700', fontSize: 16, marginBottom: 4 },
  postContent: { color: colors.text.secondary, fontSize: 14, marginBottom: 6 },
  postMeta: { color: colors.text.secondary, fontSize: 12 },
  showMoreBtn: { marginTop: 8, alignItems: 'center', justifyContent: 'center', padding: 8 },
  showMoreText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  loadingText: { color: colors.text.secondary, marginTop: 8 },
  errorText: { color: colors.error, marginTop: 8 },
  retryBtn: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  retryText: { color: colors.text.primary, fontWeight: '700' },
});
