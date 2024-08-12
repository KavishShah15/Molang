"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { ScrollArea } from '@/components/ui/scroll-area';
import { CirclePlus } from 'lucide-react';

const levelMapping = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const StoriesPage = () => {
  const { data: session, status } = useSession();
  const [currentInstruct, setCurrentInstruct] = useState('en');
  const [currentLearn, setCurrentLearn] = useState('en');
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      const fetchUserData = async () => {
        try {
          const response = await fetch(`/api/user/${session?.user?.email}`);
          const data = await response.json();
          if (response.ok) {
            if (data.currentInstruct) setCurrentInstruct(data.currentInstruct);
            if (data.currentLearn) setCurrentLearn(data.currentLearn);
          } else {
            console.error('Failed to fetch user data:', data.message);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };

      fetchUserData();
    }
  }, [session, status]);

  const fetchStories = async (creator?: string) => {
    try {
      const queryParams = new URLSearchParams();
      if (currentInstruct) queryParams.append('instructLang', currentInstruct);
      if (currentLearn) queryParams.append('learnLang', currentLearn);
      if (creator) queryParams.append('creator', creator ?? undefined); // Ensure the argument is either string or undefined

      const response = await fetch(`/api/stories?${queryParams.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setStories(data);
      } else {
        setError(data.message || 'Failed to fetch stories');
      }
    } catch (error) {
      setError('Failed to fetch stories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStories();
    }
  }, [status, currentInstruct, currentLearn]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Tabs defaultValue="library" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-[#028F9E] text-white">
        <TabsTrigger value="library" onClick={() => fetchStories()}>
          Story Library
        </TabsTrigger>
        <TabsTrigger value="yourStories" onClick={() => fetchStories(session?.user?.email ?? undefined)}>
          Your Stories
        </TabsTrigger>
      </TabsList>
      <TabsContent value="yourStories">
        <ScrollArea className="h-[calc(100vh-6rem)]">
          {session?.user ? (
            <div className="container mx-auto p-4">
              <Card
                className="rounded-lg cursor-pointer flex items-center justify-start border-none"
                onClick={() => router.push('/storygen')}
              >
                <CardContent className="gap-2 flex items-center justify-center text-[#028F9E]">
                  <CirclePlus className="w-12 h-12 font-bold" />
                  <h2 className="text-xl font-normal bg-[#06B6D4] bg-opacity-25 rounded-full p-2">Create your story</h2>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-white">
                {stories.map((story) => (
                  <div
                    key={story._id}
                    className="rounded-lg p-4 cursor-pointer"
                    onClick={() => router.push(`/stories/${story._id}`)}
                  >
                    {story.cover && (
                      <div className='bg-[#06B6D4] bg-opacity-25 p-1 rounded-lg'>
                        <img src={story.cover} alt={story.learnName} className="w-full h-64 object-cover rounded-lg" />
                      </div>
                    )}
                    <h2 className="text-xl font-semibold mb-2 px-2 text-left bg-[#028F9E] text-white rounded-full">{story.learnName}</h2>
                    <div className='flex justify-between gap-1'>
                      <p className="text-sm text-gray-600 bg-[#06B6D4] bg-opacity-25 rounded-full px-2">{story.instructName}</p>
                      <p className="text-sm text-gray-600 bg-[#06B6D4] bg-opacity-25 rounded-full px-2">{levelMapping[story.level]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p>Please log in to view your stories.</p>
          )}
        </ScrollArea>
      </TabsContent>
      <TabsContent value="library">
        <ScrollArea className="h-[calc(100vh-6rem)]">
          <div className="container mx-auto p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-white">
              {stories.map((story) => (
                <div
                  key={story._id}
                  className="rounded-lg p-4 cursor-pointer"
                  onClick={() => router.push(`/stories/${story._id}`)}
                >
                  {story.cover && (
                    <div className='bg-[#06B6D4] bg-opacity-25 p-1 rounded-lg'>
                      <img src={story.cover} alt={story.learnName} className="w-full h-64 object-cover rounded-lg" />
                    </div>
                  )}
                  <h2 className="text-xl font-semibold mb-2 px-2 text-left bg-[#028F9E] text-white rounded-full">{story.learnName}</h2>
                  <div className='flex justify-between gap-1'>
                    <p className="text-sm text-gray-600 bg-[#06B6D4] bg-opacity-25 rounded-full px-2">{story.instructName}</p>
                    <p className="text-sm text-gray-600 bg-[#06B6D4] bg-opacity-25 rounded-full px-2">{levelMapping[story.level]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
};

export default StoriesPage;
