import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import TwishList from '../twish/TwishList'
import { cn } from '@/lib/utils';

const tabTriggerStyle = [
  "relative h-12 px-6 font-medium text-sm transition-all rounded-none",
  "data-[state=active]:text-foreground data-[state=active]:font-semibold",
  "border-b-2 border-transparent",
  "after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:right-0",
  "after:h-0.5 after:bg-primary after:scale-x-0 after:origin-center",
  "data-[state=active]:after:scale-x-100",
  "after:transition-transform after:duration-300"
];

const ProfileTabs: React.FC<{ userIdParam: string }> = ({ userIdParam }) => {
  const [activeTab, setActiveTab] = useState<string>("twishes");

  // Her tab için özel boşluk mesajları
  const getEmptyMessage = (tab: string) => {
    switch (tab) {
      case "media":
        return (
          <div className="p-6 border rounded-lg bg-card">
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-lg font-semibold mb-2">No media yet</h3>
              <p>When you share photos or videos, they will appear here.</p>
            </div>
          </div>
        );
      case "likes":
        return (
          <div className="p-6 border rounded-lg bg-card">
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-4xl mb-4">❤️</div>
              <h3 className="text-lg font-semibold mb-2">No likes yet</h3>
              <p>When you like twishes, they will appear here.</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-6 border rounded-lg bg-card">
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-lg font-semibold mb-2">No twishes yet</h3>
              <p>When you post twishes, they will appear here.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <Tabs 
      value={activeTab} 
      onValueChange={setActiveTab} 
      className="w-full max-w-2xl mx-auto gap-0"
    >
      <TabsList className="w-full flex justify-center border-b border-border bg-transparent rounded-none h-auto p-0">
        <TabsTrigger
          value="twishes"
          className={cn(...tabTriggerStyle)}
        >
          Twishes
        </TabsTrigger>
        
        <TabsTrigger
          value="media"
          className={cn(...tabTriggerStyle)}
        >
          Media
        </TabsTrigger>
        
        <TabsTrigger
          value="likes"
          className={cn(...tabTriggerStyle)}
        >
          Likes
        </TabsTrigger>
      </TabsList>
      
      <div className="mt-4">
        <TabsContent value="twishes">
          <TwishList 
            userIdParam={userIdParam} 
            type="twishes" 
            emptyMessage={getEmptyMessage("twishes")}
          />
        </TabsContent>
        
        <TabsContent value="media">
          <TwishList 
            userIdParam={userIdParam} 
            type="media" 
            emptyMessage={getEmptyMessage("media")}
          />
        </TabsContent>
        
        <TabsContent value="likes">
          <TwishList 
            userIdParam={userIdParam} 
            type="likes" 
            emptyMessage={getEmptyMessage("likes")}
          />
        </TabsContent>
      </div>
    </Tabs>
  )
}

export default ProfileTabs;