import { Tabs } from "expo-router";
import { Bus, Users, MapPin } from "lucide-react-native";
import React from "react";

function RootLayoutNav() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1E40AF",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Bus color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: "Track Bus",
          tabBarIcon: ({ color }) => <MapPin color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="conductor"
        options={{
          title: "Conductor",
          tabBarIcon: ({ color }) => <Users color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return <RootLayoutNav />;
}