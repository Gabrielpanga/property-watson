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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MapPin, DollarSign, BedDouble, Bath, Star, Coffee, Bus, Building } from "lucide-react"

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Initialize Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!

export default function PropertySearch() {
  const [listView, setListView] = useState(true)
  const [sortOrder, setSortOrder] = useState("price-asc")
  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const mapContainer = useRef(null)
  const map = useRef(null)

  useEffect(() => {
    // Fetch properties from Supabase
    const fetchProperties = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
        if (error) throw error
        setProperties(data)
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
              .addTo(map.current)
          })

          // Fit map to property bounds
          const bounds = new mapboxgl.LngLatBounds()
          properties.forEach(property => {
            bounds.extend([property.longitude, property.latitude])
          })
          map.current.fitBounds(bounds, { padding: 50 })
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Find Your Perfect Property</h1>
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => setSelectedProperty(property)}>View Details</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>{property.title}</DialogTitle>
                          <DialogDescription>{property.address}</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">
                              Price
                            </Label>
                            <div className="col-span-3">
                              ${property.price.toLocaleString()}
                              {property.type === "rent" ? "/mo" : ""}
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="company" className="text-right">
                              Seller
                            </Label>
                            <div className="col-span-3">{property.company}</div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amenities" className="text-right">
                              Nearby
                            </Label>
                            <div className="col-span-3 flex space-x-2">
                              <Coffee className="w-4 h-4" />
                              <Bus className="w-4 h-4" />
                              <Building className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="analysis" className="text-right">
                              Analysis
                            </Label>
                            <div className="col-span-3">
                              Idealista: {property.idealista_score}/10
                              <br />
                              Habitaclia: {property.habitaclia_score}/10
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div ref={mapContainer} className="w-full h-[calc(100vh-200px)]" />
          )}
        </div>
      </div>
    </div>
  )
}