// Direct test for NehoID library using TypeScript source files
import { NehoID } from './src/index';

async function runDirectTests() {
  console.log('🚀 Running direct tests for NehoID library...\n');
  
  try {
    // Test basic ID generation
    console.log('--- Testing Basic ID Generation ---');
    const basicId = NehoID.generate();
    console.log('Basic ID:', basicId);
    console.log('Is string:', typeof basicId === 'string');
    console.log('Has length:', basicId.length > 0);
    
    // Test with custom options
    const customId = NehoID.generate({
      size: 20,
      segments: 3,
      separator: '-',
      prefix: 'test'
    });
    console.log('Custom ID:', customId);
    console.log('Has prefix:', customId.startsWith('test'));
    console.log('Has separators:', customId.includes('-'));
    
    // Test UUID generation
    console.log('\n--- Testing UUID Generation ---');
    const uuid = NehoID.uuid();
    console.log('UUID:', uuid);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    console.log('UUID format valid:', uuidRegex.test(uuid));
    
    // Test NanoID generation
    console.log('\n--- Testing NanoID Generation ---');
    const nanoId = NehoID.nanoid(10);
    console.log('NanoID (length 10):', nanoId);
    console.log('NanoID length correct:', nanoId.length === 10);
    
    // Test short ID generation
    console.log('\n--- Testing Short ID Generation ---');
    const shortId = NehoID.short(8);
    console.log('Short ID (length 8):', shortId);
    console.log('Short ID length correct:', shortId.length === 8);
    
    // Test hex ID generation
    console.log('\n--- Testing Hex ID Generation ---');
    const hexId = NehoID.hex(12);
    console.log('Hex ID (length 12):', hexId);
    console.log('Hex ID length correct:', hexId.length === 12);
    console.log('Hex ID format valid:', /^[0-9a-f]+$/i.test(hexId));
    
    // Test collision detection
    console.log('\n--- Testing Collision Detection ---');
    const existingIds = new Set();
    existingIds.add(NehoID.generate()); // Add one ID to the set
    
    const safeId = await NehoID.safe({
      name: 'test-collision-strategy',
      backoffType: 'linear',
      checkFunction: async (id) => !existingIds.has(id),
      maxAttempts: 3
    });
    
    console.log('Safe ID with collision detection:', safeId);
    console.log('ID is unique:', !existingIds.has(safeId));
    existingIds.add(safeId);
    
    // Test batch generation
    console.log('\n--- Testing Batch Generation ---');
    const batchIds = NehoID.batch({ count: 5, ensureUnique: true });
    console.log('Batch of 5 IDs:', batchIds);
    console.log('Batch has correct count:', batchIds.length === 5);
    console.log('All IDs are unique:', new Set(batchIds).size === 5);
    
    // Test validation
    console.log('\n--- Testing Validation ---');
    const validId = NehoID.generate();
    console.log('Valid ID:', validId);
    console.log('Validation result:', NehoID.validate(validId));
    
    // Test health check
    console.log('\n--- Testing Health Check ---');
    const healthScore = NehoID.healthCheck(validId);
    console.log('Health score:', healthScore);
    
    // Test contextual ID generation
    console.log('\n--- Testing Contextual ID Generation ---');
    const contextualId = NehoID.contextual({
      includeDevice: true,
      includeTimezone: true
    });
    console.log('Contextual ID:', contextualId);
    console.log('Has timestamp prefix:', contextualId.includes('t'));
    console.log('Has timezone info:', contextualId.includes('z'));
    
    // Test semantic ID generation
    console.log('\n--- Testing Semantic ID Generation ---');
    const semanticId = NehoID.semantic({
      prefix: 'PROD',
      region: 'US',
      department: 'SALES',
      customSegments: {
        VERSION: '1.0'
      }
    });
    console.log('Semantic ID:', semanticId);
    console.log('Has prefix:', semanticId.includes('PROD'));
    console.log('Has region:', semanticId.includes('US'));
    console.log('Has department:', semanticId.includes('SALES'));
    
    // Test compatible ID generation
    console.log('\n--- Testing Compatible ID Generation ---');
    const compatibleId = NehoID.compatible({
      platform: ['javascript', 'python'],
      format: 'lowercase',
      length: 12
    });
    console.log('Compatible ID (lowercase):', compatibleId);
    console.log('Has correct length:', compatibleId.length === 12);
    console.log('Is lowercase:', compatibleId === compatibleId.toLowerCase());
    console.log('Starts with letter:', /^[a-z]/.test(compatibleId));
    
    // Test monitoring
    console.log('\n--- Testing Monitoring ---');
    NehoID.startMonitoring();
    for (let i = 0; i < 10; i++) {
      NehoID.generate();
    }
    const stats = NehoID.getStats();
    console.log('Stats after 10 generations:', stats);
    NehoID.stopMonitoring();
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

runDirectTests();


