// WhatsApp contact utility functions

export interface WhatsAppClick {
  id: string;
  geniusId: string;
  geniusName: string;
  category: string;
  timestamp: string;
  userAgent: string;
  referrer: string;
}

// Format phone number for WhatsApp (remove + and spaces)
export const formatPhoneForWhatsApp = (phone: string): string => {
  return phone.replace(/[\s+()-]/g, '');
};

// Generate WhatsApp message
export const generateWhatsAppMessage = (geniusName: string, category: string): string => {
  const message = `Hola ${geniusName}, vi tu perfil en Genios a la Obra. Estoy interesado en tus servicios de ${category} y me gustaría conversar contigo.`;
  return encodeURIComponent(message);
};

// Generate WhatsApp URL
export const generateWhatsAppURL = (phone: string, geniusName: string, category: string): string => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const message = generateWhatsAppMessage(geniusName, category);
  return `https://wa.me/${formattedPhone}?text=${message}`;
};

// Register WhatsApp click for analytics
export const registerWhatsAppClick = (geniusId: string, geniusName: string, category: string): void => {
  try {
    const clickData: WhatsAppClick = {
      id: Date.now().toString(),
      geniusId,
      geniusName,
      category,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer || 'direct'
    };

    // Get existing clicks from localStorage
    const existingClicks = getWhatsAppClicks();
    existingClicks.push(clickData);

    // Save to localStorage (in production, this would be sent to a database)
    localStorage.setItem('whatsappClicks', JSON.stringify(existingClicks));

    // Update genius stats
    try {
      const { updateGeniusStats } = require('./geniusUtils');
      const genius = require('./geniusUtils').getGeniusById(geniusId);
      if (genius) {
        updateGeniusStats(geniusId, {
          whatsappClicks: genius.stats.whatsappClicks + 1
        });
      }
    } catch (error) {
      console.error('Error updating genius WhatsApp stats:', error);
    }
    console.log('WhatsApp click registered:', clickData);
  } catch (error) {
    console.error('Error registering WhatsApp click:', error);
  }
};

// Get all WhatsApp clicks from storage
export const getWhatsAppClicks = (): WhatsAppClick[] => {
  try {
    const clicks = localStorage.getItem('whatsappClicks');
    return clicks ? JSON.parse(clicks) : [];
  } catch (error) {
    console.error('Error loading WhatsApp clicks:', error);
    return [];
  }
};

// Get clicks for specific genius
export const getClicksForGenius = (geniusId: string): WhatsAppClick[] => {
  return getWhatsAppClicks().filter(click => click.geniusId === geniusId);
};

// Get clicks statistics
export const getWhatsAppClicksStats = () => {
  const clicks = getWhatsAppClicks();
  
  const stats = {
    totalClicks: clicks.length,
    uniqueGenios: new Set(clicks.map(click => click.geniusId)).size,
    clicksByCategory: {} as Record<string, number>,
    clicksByGenius: {} as Record<string, { name: string; clicks: number }>,
    clicksToday: 0,
    clicksThisWeek: 0,
    clicksThisMonth: 0
  };

  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  clicks.forEach(click => {
    const clickDate = new Date(click.timestamp);
    
    // Count by category
    stats.clicksByCategory[click.category] = (stats.clicksByCategory[click.category] || 0) + 1;
    
    // Count by genius
    if (!stats.clicksByGenius[click.geniusId]) {
      stats.clicksByGenius[click.geniusId] = { name: click.geniusName, clicks: 0 };
    }
    stats.clicksByGenius[click.geniusId].clicks++;
    
    // Count by time period
    if (clickDate.toDateString() === today.toDateString()) {
      stats.clicksToday++;
    }
    if (clickDate >= weekAgo) {
      stats.clicksThisWeek++;
    }
    if (clickDate >= monthAgo) {
      stats.clicksThisMonth++;
    }
  });

  return stats;
};

// Handle WhatsApp contact click
export const handleWhatsAppContact = (
  geniusId: string, 
  geniusName: string, 
  category: string, 
  phone: string
): void => {
  // Register the click first
  registerWhatsAppClick(geniusId, geniusName, category);
  
  // Generate WhatsApp URL
  const whatsappURL = generateWhatsAppURL(phone, geniusName, category);
  
  // Open WhatsApp (in new tab to avoid losing the current page)
  window.open(whatsappURL, '_blank');
};

// Export clicks data for admin dashboard
export const exportWhatsAppClicksData = (): void => {
  const clicks = getWhatsAppClicks();
  const stats = getWhatsAppClicksStats();
  
  const exportData = {
    summary: stats,
    detailedClicks: clicks,
    exportedAt: new Date().toISOString()
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `whatsapp_clicks_${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

// Clear old clicks (keep only last 90 days)
export const cleanupOldClicks = (): void => {
  const clicks = getWhatsAppClicks();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  
  const recentClicks = clicks.filter(click => 
    new Date(click.timestamp) >= ninetyDaysAgo
  );
  
  localStorage.setItem('whatsappClicks', JSON.stringify(recentClicks));
};