import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '../hooks/useColors';
import AdminAuthWrapper from './AdminAuthWrapper';

const { width } = Dimensions.get('window');

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/admin' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics', path: '/admin/analytics' },
  { id: 'monetization', label: 'Monetization', icon: 'attach-money', path: '/admin/monetization' },
  { id: 'content', label: 'Content', icon: 'video-library', path: '/admin/content' },
  { id: 'community', label: 'Community', icon: 'people', path: '/admin/community' },
  { id: 'settings', label: 'Settings', icon: 'settings', path: '/admin/settings' },
];

export default function AdminLayout({ children, title, subtitle = 'Admin Mode' }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const colors = useColors();
  const styles = createStyles(colors);

  const handleMenuPress = (path: string) => {
    // Use replace to prevent navigation stacking
    router.replace(path);
    setSidebarOpen(false);
  };

  const getActiveMenuItem = () => {
    return MENU_ITEMS.find(item => item.path === pathname) || MENU_ITEMS[0];
  };

  return (
    <AdminAuthWrapper>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => setSidebarOpen(!sidebarOpen)}
          >
            <MaterialIcons name="menu" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          
          <TouchableOpacity style={styles.backButton} onPress={() => {
            // Check if we're in admin section and navigate appropriately
            if (pathname.startsWith('/admin/')) {
              // If we're in a sub-page, go back to dashboard
              router.replace('/admin');
            } else {
              // If we're in dashboard, go back to main app
              router.back();
            }
          }}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <TouchableOpacity 
            style={styles.overlay} 
            onPress={() => setSidebarOpen(false)}
            activeOpacity={1}
          />
        )}

        {/* Sidebar */}
        <View style={[styles.sidebar, sidebarOpen && styles.sidebarOpen]}>
          <LinearGradient 
            colors={[colors.background.secondary, colors.background.tertiary]} 
            style={styles.sidebarGradient}
          >
            {/* Sidebar Header */}
            <View style={styles.sidebarHeader}>
              <View style={styles.logoContainer}>
                <MaterialIcons name="videocam" size={32} color={colors.primary} />
              </View>
              <Text style={styles.sidebarTitle}>Creator Studio</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setSidebarOpen(false)}
              >
                <MaterialIcons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
              {MENU_ITEMS.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.menuItem, isActive && styles.menuItemActive]}
                    onPress={() => handleMenuPress(item.path)}
                  >
                    <View style={[styles.menuIconContainer, isActive && styles.menuIconContainerActive]}>
                      <MaterialIcons 
                        name={item.icon as any} 
                        size={20} 
                        color={isActive ? colors.primary : colors.text.secondary} 
                      />
                    </View>
                    <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                      {item.label}
                    </Text>
                    {isActive && <View style={styles.activeIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Sidebar Footer */}
            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.footerButton}>
                <MaterialIcons name="help-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.footerButtonText}>Help & Support</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.footerButton}>
                <MaterialIcons name="logout" size={20} color={colors.text.secondary} />
                <Text style={styles.footerButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {children}
        </View>
        </LinearGradient>
      </SafeAreaView>
    </AdminAuthWrapper>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { 
    flex: 1 
  },
  gradient: { 
    flex: 1 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 13,
    marginTop: 2,
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: -280,
    width: 280,
    height: '100%',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  sidebarOpen: {
    left: 0,
  },
  sidebarGradient: {
    flex: 1,
    paddingTop: 60, // Account for header height
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sidebarTitle: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  menuContainer: {
    flex: 1,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 12,
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIconContainerActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  menuLabel: {
    flex: 1,
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  menuLabelActive: {
    color: colors.text.primary,
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  sidebarFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
  },
  footerButtonText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
});
