// src/lib/test-connection.ts
import { connectToDatabase } from './mongodb'
import { User } from '@/models/User'
import { Settings } from '@/models/Settings'

export async function testDatabaseConnection() {
  console.log('🔍 Testing MongoDB Atlas connection...')
  
  try {
    // Test connection
    await connectToDatabase()
    console.log('✅ Connected to MongoDB Atlas successfully')

    // Test creating a document
    const testUser = await User.create({
      email: 'test@example.com',
      password: 'testpassword123',
      name: 'Test User',
    })
    console.log('✅ Test user created:', testUser.email)

    // Test password hashing
    const isValid = await testUser.comparePassword('testpassword123')
    console.log('✅ Password hashing works:', isValid)

    // Create test settings
    await Settings.create({
      userId: testUser._id,
      theme: 'dark',
      fontSize: 'medium',
      language: 'en',
    })
    console.log('✅ Test settings created')

    // Clean up test data
    await User.deleteOne({ _id: testUser._id })
    await Settings.deleteOne({ userId: testUser._id })
    console.log('✅ Test data cleaned up')

    console.log('✅ All database tests passed!')
    return true
  } catch (error) {
    console.error('❌ Database test failed:', error)
    return false
  }
}

// Run if called directly
if (require.main === module) {
  testDatabaseConnection()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}