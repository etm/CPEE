require 'TestHandler'


module TestHandlerFactory
  def create_handler
    return TestHandler.new
  end
end