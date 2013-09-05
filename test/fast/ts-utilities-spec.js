describe("Fast Utilities tests",function() {
    describe("When working with hashes",function(){
        it('should turn a hash into an array',function() {
            var hash = {
                'a': "fred",
                'b': "mary",
                'c': "olympia"
            }
            var result = Rally.technicalservices.util.Utilities.hashToArray(hash);
            expect(result.length).toEqual(3);
            expect(result[0]).toEqual("fred");
        });
        it('should turn a hash of mixed types into an array',function() {
            var hash = {
                'a': "fred",
                'b': { 'd': 'value', 'e':'other value'},
                'c': null
            }
            var result = Rally.technicalservices.util.Utilities.hashToArray(hash);
            expect(result.length).toEqual(3);
            expect(result[0]).toEqual("fred");
            expect(result[2]).toBe(null);
        });
        
        it('should turn a top node into an ordered array',function() {
            var hash = {
                "ObjectID":0,
                "Name":"Workspace",
                "parent_id":0,
                "id":0,
                "text":"Workspace",
                "children":[{
                    "ObjectID":1,
                    "Name":"Parent",
                    "parent_id":0,
                    "id":1,
                    "text":"Parent",
                    "children":[{
                        "ObjectID":2,
                        "Name":"Child 1",
                        "parent_id":1,
                        "id":2,
                        "text":"Child",
                        "children":[{
                            "ObjectID":3,
                            "Name":"Grandkid",
                            "parent_id":2,
                            "id":3,
                            "text":"Grandkid",
                            "children":[]
                        }]
                    }]
                        
                 },
                 {
                    "ObjectID":1236,
                    "Name":"Parent 2",
                    "parent_id":0,
                    "id":1236,
                    "text":"Parent",
                    "children":[{
                        "ObjectID":1235,
                        "Name":"Child a",
                        "parent_id":1236,
                        "id":1235,
                        "text":"Child",
                        "children":[{
                            "ObjectID":1234,
                            "Name":"Grandkid",
                            "parent_id":1235,
                            "id":1234,
                            "text":"Grandkid",
                            "children":[]
                        },
                        {
                            "ObjectID":1233,
                            "Name":"Grandkid 2",
                            "parent_id":1235,
                            "id":1233,
                            "text":"Grandkid 2",
                            "children":[]
                        }]
                    }]
                }]
            }; 
            var result = Rally.technicalservices.util.Utilities.hashToOrderedArray(hash,"children");
            expect(result.length).toEqual(8);
            expect(result[0].Name).toEqual("Workspace");
            expect(result[2].Name).toEqual("Parent 2");
        });
    });
});