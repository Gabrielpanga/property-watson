"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DollarSign, BedDouble, Bath, Star, Coffee, Bus, Building, Heart, User, Settings, LogOut } from "lucide-react"

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Initialize Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!

// Define the Property interface
interface Property {
  id: number;
  title: string;
  type: 'rent' | 'buy';
  price: number;
  bedrooms: number;
  bathrooms: number;
  address: string;
  image: string;
  rating: number;
  reviews: number;
  longitude: number;
  latitude: number;
  company: string;
  idealista_score: number;
  habitaclia_score: number;
  description?: string;
}

export default function PropertySearch() {
  const [listView, setListView] = useState(true)
  const [sortOrder, setSortOrder] = useState("price-asc")
  const [properties, setProperties] = useState<Property[]>([])
  const [favorites, setFavorites] = useState<number[]>([])
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    // Fetch properties from Supabase
    const fetchProperties = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
        if (error) throw error
        setProperties(data as Property[])
      } catch (error) {
        console.error('Error fetching properties:', error)
      }
    }

    fetchProperties()
  }, [])

  useEffect(() => {
    if (!listView && !map.current && mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-74.5, 40], // Default center
        zoom: 9
      })

      map.current.on('load', () => {
        if (properties.length > 0) {
          // Add markers for each property
          properties.forEach(property => {
            new mapboxgl.Marker()
              .setLngLat([property.longitude, property.latitude])
              .addTo(map.current!)
          })

          // Fit map to property bounds
          const bounds = new mapboxgl.LngLatBounds()
          properties.forEach(property => {
            bounds.extend([property.longitude, property.latitude])
          })
          map.current!.fitBounds(bounds, { padding: 50 })
        }
      })
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [listView, properties])

  const sortedProperties = [...properties].sort((a, b) => {
    if (sortOrder === "price-asc") return a.price - b.price
    if (sortOrder === "price-desc") return b.price - a.price
    if (sortOrder === "rating-desc") return b.rating - a.rating
    return 0
  })

  const toggleFavorite = (propertyId: number) => {
    setFavorites(prevFavorites =>
      prevFavorites.includes(propertyId)
        ? prevFavorites.filter(id => id !== propertyId)
        : [...prevFavorites, propertyId]
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Property Search</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">John Doe</p>
                  <p className="text-xs leading-none text-muted-foreground">john@example.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Heart className="mr-2 h-4 w-4" />
                <span>Favorites</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4">
        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Search Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup defaultValue="all">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">All</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rent" id="rent" />
                  <Label htmlFor="rent">For Rent</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="buy" id="buy" />
                  <Label htmlFor="buy">For Sale</Label>
                </div>
              </RadioGroup>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="Enter city, zip, or address" />
              </div>
              <div className="space-y-2">
                <Label>Price Range</Label>
                <Slider defaultValue={[0, 1000000]} max={1000000} step={1000} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="property-type">Property Type</Label>
                <Select>
                  <SelectTrigger id="property-type">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full">Apply Filters</Button>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Tabs defaultValue="list" className="w-[400px]">
                <TabsList>
                  <TabsTrigger value="list" onClick={() => setListView(true)}>
                    List View
                  </TabsTrigger>
                  <TabsTrigger value="map" onClick={() => setListView(false)}>
                    Map View
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating-desc">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {listView ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sortedProperties.map((property) => (
                  <Card key={property.id}>
                    <CardHeader>
                      <img src={property.image} alt={property.title} className="w-full h-48 object-cover rounded-t-lg" />
                    </CardHeader>
                    <CardContent>
                      <CardTitle>{property.title}</CardTitle>
                      <CardDescription>{property.address}</CardDescription>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          <span className="font-bold">
                            {property.type === "rent"
                              ? `$${property.price}/mo`
                              : `$${property.price.toLocaleString()}`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BedDouble className="w-4 h-4" />
                          <span>{property.bedrooms}</span>
                          <Bath className="w-4 h-4" />
                          <span>{property.bathrooms}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span>{property.rating}</span>
                        <span className="text-sm text-gray-500 ml-1">({property.reviews} reviews)</span>
                      </div>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline">View Details</Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[625px]">
                            <DialogHeader>
                              <DialogTitle>{property.title}</DialogTitle>
                              <DialogDescription>{property.address}</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <img src={property.image} alt={property.title} className="w-full h-64 object-cover rounded-lg" />
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="font-bold">Price:</span>
                                    <span>${property.price.toLocaleString()}{property.type === "rent" ? "/mo" : ""}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-bold">Type:</span>
                                    <span>{property.type === "rent" ? "For Rent" : "For Sale"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-bold">Bedrooms:</span>
                                    <span>{property.bedrooms}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-bold">Bathrooms:</span>
                                    <span>{property.bathrooms}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-bold">Rating:</span>
                                    <span>{property.rating} ({property.reviews} reviews)</span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-bold mb-2">Description</h4>
                                <p>{property.description || "No description available."}</p>
                              </div>
                              <div>
                                <h4 className="font-bold mb-2">Seller Information</h4>
                                <p>{property.company}</p>
                              </div>
                              <div>
                                <h4 className="font-bold mb-2">Nearby Amenities</h4>
                                <div className="flex space-x-2">
                                  <Coffee className="w-4 h-4" />
                                  <Bus className="w-4 h-4" />
                                  <Building className="w-4 h-4" />
                                </div>
                              </div>
                              <div>
                                <h4 className="font-bold mb-2">Property Analysis</h4>
                                <div className="flex justify-between">
                                  <span>Idealista Score:</span>
                                  <span>{property.idealista_score}/10</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Habitaclia Score:</span>
                                  <span>{property.habitaclia_score}/10</span>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleFavorite(property.id)}
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              favorites.includes(property.id) ? "fill-red-500" : ""
                            }`}
                          />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div ref={mapContainer} className="w-full h-[calc(100vh-200px)]" />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}